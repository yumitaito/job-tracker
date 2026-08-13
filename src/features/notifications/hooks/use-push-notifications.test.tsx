import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useDisablePushNotifications,
  useEnablePushNotifications,
  usePushNotificationStatus,
  useSyncPushSubscription,
} from "./use-push-notifications";
import {
  deletePushSubscription,
  hasPushSubscription,
  savePushSubscription,
} from "@/features/notifications/api/push-subscriptions-api";
import {
  getExistingPushSubscription,
  isPushSupported,
  serializePushSubscriptionFromKeys,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/features/notifications/lib/push-subscription";

vi.mock("@/features/notifications/api/push-subscriptions-api", () => ({
  savePushSubscription: vi.fn(),
  deletePushSubscription: vi.fn(),
  hasPushSubscription: vi.fn(),
}));

vi.mock("@/features/notifications/lib/push-subscription", () => ({
  getExistingPushSubscription: vi.fn(),
  isPushSupported: vi.fn(),
  serializePushSubscriptionFromKeys: vi.fn(),
  subscribeToPushNotifications: vi.fn(),
  unsubscribeFromPushNotifications: vi.fn(),
}));

const mockedSavePushSubscription = vi.mocked(savePushSubscription);
const mockedDeletePushSubscription = vi.mocked(deletePushSubscription);
const mockedHasPushSubscription = vi.mocked(hasPushSubscription);
const mockedGetExistingPushSubscription = vi.mocked(getExistingPushSubscription);
const mockedIsPushSupported = vi.mocked(isPushSupported);
const mockedSerializePushSubscriptionFromKeys = vi.mocked(serializePushSubscriptionFromKeys);
const mockedSubscribeToPushNotifications = vi.mocked(subscribeToPushNotifications);
const mockedUnsubscribeFromPushNotifications = vi.mocked(unsubscribeFromPushNotifications);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("usePushNotificationStatus", () => {
  it("未対応ブラウザの場合はsupported:falseを返し、DBへの問い合わせを行わない", async () => {
    mockedIsPushSupported.mockReturnValue(false);

    const { result } = renderHook(() => usePushNotificationStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ supported: false, subscribed: false, permission: "default" });
    expect(mockedHasPushSubscription).not.toHaveBeenCalled();
  });

  it("ブラウザ購読とDB保存の両方が揃っている場合はsubscribed:trueを返す", async () => {
    mockedIsPushSupported.mockReturnValue(true);
    mockedGetExistingPushSubscription.mockResolvedValue({ endpoint: "e" } as unknown as PushSubscription);
    mockedHasPushSubscription.mockResolvedValue(true);
    vi.stubGlobal("Notification", { permission: "granted" });

    const { result } = renderHook(() => usePushNotificationStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ supported: true, subscribed: true, permission: "granted" });
  });

  it("ブラウザには購読があってもDBに保存されていない場合はsubscribed:falseを返す", async () => {
    mockedIsPushSupported.mockReturnValue(true);
    mockedGetExistingPushSubscription.mockResolvedValue({ endpoint: "e" } as unknown as PushSubscription);
    mockedHasPushSubscription.mockResolvedValue(false);
    vi.stubGlobal("Notification", { permission: "granted" });

    const { result } = renderHook(() => usePushNotificationStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.subscribed).toBe(false);
  });

  it("DBへの問い合わせがエラーになった場合はisErrorになる", async () => {
    mockedIsPushSupported.mockReturnValue(true);
    mockedGetExistingPushSubscription.mockResolvedValue(null);
    mockedHasPushSubscription.mockRejectedValue(new Error("DB error"));
    vi.stubGlobal("Notification", { permission: "default" });

    const { result } = renderHook(() => usePushNotificationStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useEnablePushNotifications", () => {
  it("購読とDB保存に成功した場合はisSuccessになる", async () => {
    const subscription = { endpoint: "https://example.com/push/1" } as unknown as PushSubscription;
    mockedSubscribeToPushNotifications.mockResolvedValue(subscription);
    mockedSerializePushSubscriptionFromKeys.mockReturnValue({
      endpoint: "https://example.com/push/1",
      p256dh: "p",
      auth: "a",
    });

    const { result } = renderHook(() => useEnablePushNotifications(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedSavePushSubscription).toHaveBeenCalledWith({
      endpoint: "https://example.com/push/1",
      p256dh: "p",
      auth: "a",
    });
  });

  it("購読がnullで返ってきた場合はエラーになる", async () => {
    mockedSubscribeToPushNotifications.mockResolvedValue(null);

    const { result } = renderHook(() => useEnablePushNotifications(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Push 通知の購読に失敗しました");
    expect(mockedSavePushSubscription).not.toHaveBeenCalled();
  });

  it("subscribeToPushNotificationsが拒否された場合はそのエラーメッセージを伝播する", async () => {
    mockedSubscribeToPushNotifications.mockRejectedValue(new Error("通知の許可が必要です"));

    const { result } = renderHook(() => useEnablePushNotifications(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("通知の許可が必要です");
  });
});

describe("useDisablePushNotifications", () => {
  it("購読が存在する場合はDB削除とブラウザ購読解除の両方を行う", async () => {
    const subscription = { endpoint: "https://example.com/push/1" } as unknown as PushSubscription;
    mockedGetExistingPushSubscription.mockResolvedValue(subscription);

    const { result } = renderHook(() => useDisablePushNotifications(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedDeletePushSubscription).toHaveBeenCalledWith("https://example.com/push/1");
    expect(mockedUnsubscribeFromPushNotifications).toHaveBeenCalled();
  });

  it("購読が存在しない場合は何もせず成功扱いになる", async () => {
    mockedGetExistingPushSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => useDisablePushNotifications(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedDeletePushSubscription).not.toHaveBeenCalled();
    expect(mockedUnsubscribeFromPushNotifications).not.toHaveBeenCalled();
  });
});

describe("useSyncPushSubscription", () => {
  beforeEach(() => {
    vi.stubGlobal("Notification", { permission: "granted" });
  });

  it("未対応ブラウザの場合は何もしない", async () => {
    mockedIsPushSupported.mockReturnValue(false);

    const { result } = renderHook(() => useSyncPushSubscription(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGetExistingPushSubscription).not.toHaveBeenCalled();
    expect(mockedSavePushSubscription).not.toHaveBeenCalled();
  });

  it("通知が許可されていない場合は何もしない", async () => {
    mockedIsPushSupported.mockReturnValue(true);
    vi.stubGlobal("Notification", { permission: "denied" });

    const { result } = renderHook(() => useSyncPushSubscription(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedSavePushSubscription).not.toHaveBeenCalled();
  });

  it("対応・許可済みだがブラウザ側の購読が無い場合は保存しない", async () => {
    mockedIsPushSupported.mockReturnValue(true);
    mockedGetExistingPushSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => useSyncPushSubscription(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedSavePushSubscription).not.toHaveBeenCalled();
  });

  it("対応・許可済み・購読ありの場合はDBへ同期保存する", async () => {
    const subscription = { endpoint: "https://example.com/push/1" } as unknown as PushSubscription;
    mockedIsPushSupported.mockReturnValue(true);
    mockedGetExistingPushSubscription.mockResolvedValue(subscription);
    mockedSerializePushSubscriptionFromKeys.mockReturnValue({
      endpoint: "https://example.com/push/1",
      p256dh: "p",
      auth: "a",
    });

    const { result } = renderHook(() => useSyncPushSubscription(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedSavePushSubscription).toHaveBeenCalledWith({
      endpoint: "https://example.com/push/1",
      p256dh: "p",
      auth: "a",
    });
  });
});
