import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getExistingPushSubscription,
  isPushSupported,
  registerServiceWorker,
  serializePushSubscriptionFromKeys,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "./push-subscription";

/** base64url文字列を元のバイト列に戻すテスト用ヘルパー（本体側のurlBase64ToUint8Arrayは非公開のためここで再実装） */
function base64UrlToBytes(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** テスト間でnavigator.serviceWorkerをリストアするために元の記述子を退避しておく */
const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");

function stubServiceWorker(value: unknown) {
  Object.defineProperty(navigator, "serviceWorker", {
    value,
    configurable: true,
    writable: true,
  });
}

function removeServiceWorker() {
  if (originalServiceWorkerDescriptor) {
    Object.defineProperty(navigator, "serviceWorker", originalServiceWorkerDescriptor);
  } else {
    // @ts-expect-error テスト用に削除する
    delete navigator.serviceWorker;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  removeServiceWorker();
});

describe("isPushSupported", () => {
  it("serviceWorker・PushManager・Notificationすべて揃っている場合はtrueを返す", () => {
    stubServiceWorker({});
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    expect(isPushSupported()).toBe(true);
  });

  it("serviceWorkerが無い場合はfalseを返す", () => {
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    expect(isPushSupported()).toBe(false);
  });

  it("PushManagerが無い場合はfalseを返す", () => {
    stubServiceWorker({});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    expect(isPushSupported()).toBe(false);
  });

  it("Notificationが無い場合はfalseを返す", () => {
    stubServiceWorker({});
    vi.stubGlobal("PushManager", class {});

    expect(isPushSupported()).toBe(false);
  });
});

describe("registerServiceWorker", () => {
  it("未対応ブラウザの場合はnullを返す（Service Workerの登録を試みない）", async () => {
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    await expect(registerServiceWorker()).resolves.toBeNull();
  });

  it("対応ブラウザの場合はservice workerを登録し、readyになったregistrationを返す", async () => {
    const registration = { scope: "/" };
    const register = vi.fn().mockResolvedValue(registration);
    stubServiceWorker({ register, ready: Promise.resolve(registration) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    const result = await registerServiceWorker();

    expect(register).toHaveBeenCalledWith("/sw.js");
    expect(result).toBe(registration);
  });
});

describe("getExistingPushSubscription", () => {
  it("未対応ブラウザの場合はnullを返す", async () => {
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    await expect(getExistingPushSubscription()).resolves.toBeNull();
  });

  it("対応ブラウザの場合はregistration.pushManager.getSubscription()の結果を返す", async () => {
    const subscription = { endpoint: "https://example.com/push/1" };
    const getSubscription = vi.fn().mockResolvedValue(subscription);
    const registration = { pushManager: { getSubscription } };
    const getRegistration = vi.fn().mockResolvedValue(registration);
    stubServiceWorker({ getRegistration, ready: new Promise(() => {}) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    await expect(getExistingPushSubscription()).resolves.toBe(subscription);
  });

  it("Service Workerが未登録の場合はreadyを待たずに即座にnullを返す（本番の無限ローディング回避）", async () => {
    // getRegistration()はundefinedを返す一方、readyは（未登録のため）永遠に解決しないPromiseにしておき、
    // getExistingPushSubscription()がreadyを待たずに解決することを検証する
    const getRegistration = vi.fn().mockResolvedValue(undefined);
    stubServiceWorker({ getRegistration, ready: new Promise(() => {}) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    await expect(getExistingPushSubscription()).resolves.toBeNull();
  });
});

describe("subscribeToPushNotifications", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "dGVzdC12YXBpZC1rZXk"); // 適当なbase64url文字列
  });

  it("VAPID公開鍵が未設定の場合はエラーを投げる", async () => {
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "");

    await expect(subscribeToPushNotifications()).rejects.toThrow(
      "VAPID公開鍵が設定されていません（VITE_VAPID_PUBLIC_KEY）",
    );
  });

  it("通知の許可が得られなかった場合はエラーを投げる", async () => {
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn().mockResolvedValue("denied"),
      permission: "default",
    });

    await expect(subscribeToPushNotifications()).rejects.toThrow("通知の許可が必要です");
  });

  it("Service Workerに対応していない場合はエラーを投げる", async () => {
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn().mockResolvedValue("granted"),
      permission: "default",
    });
    // navigator.serviceWorker / window.PushManager は未定義のまま（未対応環境を再現）

    await expect(subscribeToPushNotifications()).rejects.toThrow(
      "Service Worker を登録できませんでした",
    );
  });

  it("既存の購読がある場合は新規購読せずそれを返す", async () => {
    const existingSubscription = { endpoint: "https://example.com/push/existing" };
    const subscribe = vi.fn();
    const registration = {
      pushManager: { getSubscription: vi.fn().mockResolvedValue(existingSubscription), subscribe },
    };
    stubServiceWorker({ register: vi.fn().mockResolvedValue(registration), ready: Promise.resolve(registration) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn().mockResolvedValue("granted"),
      permission: "default",
    });

    const result = await subscribeToPushNotifications();

    expect(result).toBe(existingSubscription);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("既存の購読が無い場合はpushManager.subscribeを呼び出して新規購読を返す", async () => {
    const newSubscription = { endpoint: "https://example.com/push/new" };
    const subscribe = vi.fn().mockResolvedValue(newSubscription);
    const registration = {
      pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe },
    };
    stubServiceWorker({ register: vi.fn().mockResolvedValue(registration), ready: Promise.resolve(registration) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn().mockResolvedValue("granted"),
      permission: "default",
    });

    const result = await subscribeToPushNotifications();

    expect(result).toBe(newSubscription);
    expect(subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) }),
    );
  });
});

describe("unsubscribeFromPushNotifications", () => {
  it("購読が存在する場合はunsubscribe()を呼び出す", async () => {
    const unsubscribe = vi.fn().mockResolvedValue(true);
    const registration = {
      pushManager: { getSubscription: vi.fn().mockResolvedValue({ unsubscribe }) },
    };
    const getRegistration = vi.fn().mockResolvedValue(registration);
    stubServiceWorker({ getRegistration, ready: new Promise(() => {}) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    await unsubscribeFromPushNotifications();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it("購読が存在しない場合は何もせずエラーにならない", async () => {
    const registration = { pushManager: { getSubscription: vi.fn().mockResolvedValue(null) } };
    const getRegistration = vi.fn().mockResolvedValue(registration);
    stubServiceWorker({ getRegistration, ready: new Promise(() => {}) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    await expect(unsubscribeFromPushNotifications()).resolves.toBeUndefined();
  });

  it("Service Workerが未登録の場合は何もせずエラーにならない", async () => {
    const getRegistration = vi.fn().mockResolvedValue(undefined);
    stubServiceWorker({ getRegistration, ready: new Promise(() => {}) });
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { requestPermission: vi.fn(), permission: "default" });

    await expect(unsubscribeFromPushNotifications()).resolves.toBeUndefined();
  });
});

describe("serializePushSubscriptionFromKeys", () => {
  it("p256dh・authキーをbase64url文字列に変換し、endpointをそのまま返す", () => {
    const p256dhBytes = new Uint8Array([1, 2, 3, 251, 252, 253]);
    const authBytes = new Uint8Array([10, 20, 30]);
    const subscription = {
      endpoint: "https://example.com/push/abc",
      getKey: (name: string) => (name === "p256dh" ? p256dhBytes.buffer : authBytes.buffer),
    } as unknown as PushSubscription;

    const result = serializePushSubscriptionFromKeys(subscription);

    expect(result.endpoint).toBe("https://example.com/push/abc");
    expect(result.p256dh).not.toMatch(/[+/=]/);
    expect(result.auth).not.toMatch(/[+/=]/);
    expect(base64UrlToBytes(result.p256dh)).toEqual(p256dhBytes);
    expect(base64UrlToBytes(result.auth)).toEqual(authBytes);
  });

  it("キーが取得できない場合は空文字を返す", () => {
    const subscription = {
      endpoint: "https://example.com/push/xyz",
      getKey: () => null,
    } as unknown as PushSubscription;

    const result = serializePushSubscriptionFromKeys(subscription);

    expect(result.p256dh).toBe("");
    expect(result.auth).toBe("");
  });
});
