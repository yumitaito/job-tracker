import { useEffect } from "react";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useSyncPushSubscription } from "@/features/notifications/hooks/use-push-notifications";
import { isPushSupported } from "@/features/notifications/lib/push-subscription";

/** ログイン済みかつ通知許可済みの場合、Push 購読情報を DB と同期する */
export function PushSubscriptionSync() {
  const { user } = useAuth();
  const syncPush = useSyncPushSubscription();
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !isPushSupported() || Notification.permission !== "granted") return;
    syncPush.mutate();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
