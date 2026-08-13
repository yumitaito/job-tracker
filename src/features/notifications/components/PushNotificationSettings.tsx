import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useDisablePushNotifications,
  useEnablePushNotifications,
  usePushNotificationStatus,
} from "@/features/notifications/hooks/use-push-notifications";

export function PushNotificationSettings() {
  const { data: status, isLoading } = usePushNotificationStatus();
  const enablePush = useEnablePushNotifications();
  const disablePush = useDisablePushNotifications();

  const errorMessage = enablePush.error?.message ?? disablePush.error?.message ?? null;
  const isPending = enablePush.isPending || disablePush.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">通知設定を読み込み中...</p>
      </div>
    );
  }

  if (!status?.supported) {
    return (
      <div className="space-y-4 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-secondary [&_svg]:size-4">
            <BellOff />
          </span>
          面接リマインダー通知
        </h2>
        <p className="text-sm text-muted-foreground">
          このブラウザは Web Push 通知に対応していません。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-secondary [&_svg]:size-4">
              <Bell />
            </span>
            面接リマインダー通知
          </h2>
          <p className="text-sm text-muted-foreground">
            面接開始5分前に、ブラウザを閉じていても OS 通知でお知らせします。
          </p>
        </div>

        {status.subscribed ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => disablePush.mutate()}
            className="sm:shrink-0"
          >
            <BellOff />
            {isPending ? "解除中..." : "通知をオフにする"}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => enablePush.mutate()}
            className="sm:shrink-0"
          >
            <Bell />
            {isPending ? "設定中..." : "通知をオンにする"}
          </Button>
        )}
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {status.permission === "denied" && !status.subscribed && (
        <Alert variant="destructive">
          <AlertDescription>
            ブラウザで通知がブロックされています。アドレスバー横の設定から通知を許可してください。
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
