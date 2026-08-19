import { cn } from "@/lib/utils";
import { isToday } from "@/lib/format";
import { isInterviewPast } from "@/features/jobs/lib/interview";
import type { JobStatus } from "@/features/jobs/types/job";

const ENDED_JOB_STATUSES = new Set<JobStatus>(["rejected", "withdrawn"]);

export function isJobListEndedStatus(status: JobStatus): boolean {
  return ENDED_JOB_STATUSES.has(status);
}

/** 不採用・辞退の一覧カード/行向けスタイル */
export function getJobListSurfaceClassName(status: JobStatus): string {
  return cn(isJobListEndedStatus(status) && "bg-muted/40");
}

/** 面接日時テキスト向けスタイル */
export function getInterviewDateTimeClassName(at: string, now: Date = new Date()): string {
  if (isInterviewPast(at, now)) {
    return "whitespace-nowrap border-neutral-300 bg-muted/80 text-neutral-600";
  }

  if (isToday(at, now)) {
    return "whitespace-nowrap font-bold text-destructive";
  }

  return "whitespace-nowrap";
}

/** 一覧の選考ステータス Select 向けスタイル */
export function getJobStatusSelectClassName(status: JobStatus): string {
  if (status === "offer") {
    return "border-green-200 bg-green-100 font-semibold text-green-800";
  }

  return "bg-white";
}
