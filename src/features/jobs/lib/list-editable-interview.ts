import type { LatestInterview } from "@/features/jobs/lib/interview";
import { getInterviewUrl, getLatestInterview } from "@/features/jobs/lib/interview";
import type { Job, JobStatus } from "@/features/jobs/types/job";

export type InterviewDateField =
  | "casual_interview_at"
  | "first_interview_at"
  | "second_interview_at"
  | "final_interview_at";

const STAGE_TO_FIELD: Record<LatestInterview["stage"], InterviewDateField> = {
  casual_interview: "casual_interview_at",
  first_interview: "first_interview_at",
  second_interview: "second_interview_at",
  final_interview: "final_interview_at",
};

const INTERVIEW_STATUSES = new Set<JobStatus>([
  "casual_interview",
  "first_interview",
  "second_interview",
  "final_interview",
]);

export type ListEditableInterview = {
  stage: LatestInterview["stage"];
  field: InterviewDateField;
  at: string | null;
  url: string | null;
};

/** 一覧で編集対象となる面接日時（表示中の段階に対応するフィールド）を返す。 */
export function getListEditableInterview(job: Job): ListEditableInterview {
  const latest = getLatestInterview(job);
  if (latest) {
    return {
      stage: latest.stage,
      field: STAGE_TO_FIELD[latest.stage],
      at: latest.at,
      url: getInterviewUrl(job, latest.stage),
    };
  }

  if (INTERVIEW_STATUSES.has(job.status)) {
    const stage = job.status as LatestInterview["stage"];
    return {
      stage,
      field: STAGE_TO_FIELD[stage],
      at: job[STAGE_TO_FIELD[stage]],
      url: getInterviewUrl(job, stage),
    };
  }

  return {
    stage: "first_interview",
    field: "first_interview_at",
    at: job.first_interview_at,
    url: getInterviewUrl(job, "first_interview"),
  };
}
