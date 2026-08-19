import type { LatestInterview } from "@/features/jobs/lib/interview";
import { getInterviewUrl, getLatestInterview } from "@/features/jobs/lib/interview";
import {
  getInterviewScheduleLabel,
  getJobInterviewSchedules,
  sortInterviewSchedules,
  updateInterviewScheduleDateTime,
} from "@/features/jobs/lib/interview-schedules";
import type { InterviewSchedule } from "@/features/jobs/types/interview-schedule";
import { INTERVIEW_SCHEDULE_KIND_LABELS } from "@/features/jobs/types/interview-schedule";
import type { Job, JobStatus, UpdateJobInput } from "@/features/jobs/types/job";

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
  scheduleId: string;
  stage: LatestInterview["stage"] | "other";
  label: string;
  field?: InterviewDateField;
  at: string | null;
  url: string | null;
};

function findEditableSchedule(job: Job): InterviewSchedule | null {
  const schedules = getJobInterviewSchedules(job);
  const latest = getLatestInterview(job);
  if (latest) {
    return schedules.find((schedule) => schedule.kind === latest.stage) ?? null;
  }

  if (INTERVIEW_STATUSES.has(job.status)) {
    return schedules.find((schedule) => schedule.kind === job.status) ?? null;
  }

  return schedules.find((schedule) => schedule.kind === "first_interview") ?? schedules[0] ?? null;
}

/** 一覧で編集対象となる面接日時（表示中の段階に対応するフィールド）を返す。 */
export function getListEditableInterview(job: Job): ListEditableInterview {
  const schedule = findEditableSchedule(job);
  if (schedule) {
    const stage = schedule.kind;
    const isLegacyStage = stage !== "other" && stage !== "third_interview";
    return {
      scheduleId: schedule.id,
      stage: isLegacyStage ? (stage as LatestInterview["stage"]) : "other",
      label: getInterviewScheduleLabel(schedule),
      field: isLegacyStage ? STAGE_TO_FIELD[stage as LatestInterview["stage"]] : undefined,
      at: schedule.scheduled_at ?? null,
      url: schedule.url ?? null,
    };
  }

  return {
    scheduleId: "",
    stage: "first_interview",
    label: INTERVIEW_SCHEDULE_KIND_LABELS.first_interview,
    field: "first_interview_at",
    at: job.first_interview_at,
    url: getInterviewUrl(job, "first_interview"),
  };
}

/** 一覧インライン編集の面接日時更新ペイロードを生成する */
export function buildInterviewDateUpdateInput(
  job: Job,
  scheduleId: string,
  scheduledAt: string | null,
): UpdateJobInput {
  const schedules = getJobInterviewSchedules(job);
  const updatedSchedules = updateInterviewScheduleDateTime(schedules, scheduleId, scheduledAt);
  const sorted = sortInterviewSchedules(updatedSchedules);
  const target = sorted.find((schedule) => schedule.id === scheduleId);

  const input: UpdateJobInput = {
    interview_schedules: sorted,
  };

  if (target && target.kind !== "other" && target.kind !== "third_interview") {
    input[STAGE_TO_FIELD[target.kind as LatestInterview["stage"]]] = scheduledAt;
  }

  return input;
}
