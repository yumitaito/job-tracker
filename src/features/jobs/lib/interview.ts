import type { Job, JobStatus } from "@/features/jobs/types/job";

export type LatestInterview = {
  stage: Extract<JobStatus, "first_interview" | "second_interview" | "final_interview">;
  at: string;
};

/** 面接日時の見出しラベル（選考ステータスバッジ用の`JOB_STATUS_LABELS`とは別に用意する） */
export const INTERVIEW_STAGE_LABELS: Record<LatestInterview["stage"], string> = {
  first_interview: "一次面接日時",
  second_interview: "二次面接日時",
  final_interview: "最終面接日時",
};

/** 求人の面接日時のうち、最も選考が進んだ段階のものを1つ返す。未入力ならnull。 */
export function getLatestInterview(job: Job): LatestInterview | null {
  if (job.final_interview_at) return { stage: "final_interview", at: job.final_interview_at };
  if (job.second_interview_at) return { stage: "second_interview", at: job.second_interview_at };
  if (job.first_interview_at) return { stage: "first_interview", at: job.first_interview_at };
  return null;
}
