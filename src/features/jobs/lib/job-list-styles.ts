import { cn } from "@/lib/utils";
import { isToday } from "@/lib/format";
import { isInterviewPast } from "@/features/jobs/lib/interview";

/** 面接終了済みの一覧カード/行向けスタイル */
export function getPastInterviewSurfaceClassName(isPastInterview: boolean): string {
  return cn(isPastInterview && "opacity-55 saturate-[.65] bg-muted/20");
}

/** 面接日時テキスト向けスタイル */
export function getInterviewDateTimeClassName(at: string, now: Date = new Date()): string {
  if (isInterviewPast(at, now)) {
    return "whitespace-nowrap text-muted-foreground";
  }

  if (isToday(at)) {
    return "whitespace-nowrap font-bold text-destructive";
  }

  return "whitespace-nowrap";
}
