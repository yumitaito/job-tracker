import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/features/auth/api/auth-api";
import { deletePushSubscription } from "@/features/notifications/api/push-subscriptions-api";
import { getExistingPushSubscription } from "@/features/notifications/lib/push-subscription";

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      // ブラウザ購読は維持して次回ログイン時に再同期するが、ログアウト中の配信は止める
      try {
        const subscription = await getExistingPushSubscription();
        if (subscription) await deletePushSubscription(subscription.endpoint);
      } catch {
        // 通知情報の掃除に失敗しても、ユーザーがログアウトできない状態にはしない
      }
      await signOut();
    },
  });
}
