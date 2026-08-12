import { Link } from "react-router-dom";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyJobsState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-bold text-foreground">
          {filtered ? "該当する求人がありません" : "求人がまだ登録されていません"}
        </p>
        <p className="text-sm text-muted-foreground">
          {filtered
            ? "絞り込み条件を変更するか、新しい求人を登録してみましょう。"
            : "気になる求人を登録して、応募状況を管理しましょう。"}
        </p>
      </div>
      <Button asChild>
        <Link to="/jobs/new">
          <Plus />
          求人を登録
        </Link>
      </Button>
    </div>
  );
}
