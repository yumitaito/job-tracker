import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function QueryErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive" className="mx-auto max-w-xl">
      <AlertTriangle />
      <AlertTitle>データの取得に失敗しました</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message ?? "しばらく経ってから再度お試しください。"}</p>
        <Button type="button" variant="destructive" size="sm" onClick={onRetry}>
          再読み込み
        </Button>
      </AlertDescription>
    </Alert>
  );
}
