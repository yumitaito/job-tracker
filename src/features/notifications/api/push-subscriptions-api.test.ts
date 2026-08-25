import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc },
}));

import { savePushSubscription } from "@/features/notifications/api/push-subscriptions-api";

describe("savePushSubscription", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("endpointの所有権をclaim_push_subscription RPCで移管する", async () => {
    rpc.mockResolvedValue({ error: null });

    await savePushSubscription({
      endpoint: "https://push.example/subscription",
      p256dh: "public-key",
      auth: "auth-secret",
    });

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("claim_push_subscription", {
      subscription_endpoint: "https://push.example/subscription",
      subscription_p256dh: "public-key",
      subscription_auth: "auth-secret",
    });
  });

  it("RPCエラーを呼び出し元へ伝える", async () => {
    rpc.mockResolvedValue({ error: { message: "購読を保存できません" } });

    await expect(savePushSubscription({ endpoint: "e", p256dh: "p", auth: "a" }))
      .rejects.toThrow("購読を保存できません");
  });
});
