import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const pushKeys = {
  all: ["push-notifications"] as const,
  status: () => [...pushKeys.all, "status"] as const,
};

export function usePushNotificationStatus() {
  return useQuery({
    queryKey: pushKeys.status(),
    queryFn: async () => {
      if (!isPushSupported()) {
        return { supported: false, subscribed: false, permission: "default" as NotificationPermission };
      }

      const [subscription, stored] = await Promise.all([
        getExistingPushSubscription(),
        hasPushSubscription(),
      ]);

      return {
        supported: true,
        subscribed: Boolean(subscription) && stored,
        permission: Notification.permission,
      };
    },
  });
}

export function useEnablePushNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const subscription = await subscribeToPushNotifications();
      if (!subscription) {
        throw new Error("Push 通知の購読に失敗しました");
      }

      await savePushSubscription(serializePushSubscriptionFromKeys(subscription));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pushKeys.status() });
    },
  });
}

export function useDisablePushNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const subscription = await getExistingPushSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await unsubscribeFromPushNotifications();
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pushKeys.status() });
    },
  });
}

export function useSyncPushSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isPushSupported() || Notification.permission !== "granted") return;

      const subscription = await getExistingPushSubscription();
      if (!subscription) return;

      await savePushSubscription(serializePushSubscriptionFromKeys(subscription));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pushKeys.status() });
    },
  });
}
