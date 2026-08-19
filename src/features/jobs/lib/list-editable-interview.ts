import type { LatestInterview } from "@/features/jobs/lib/interview";
import { getInterviewUrl } from "@/features/jobs/lib/interview";
import {
  createEmptyInterviewSchedule,
  getInterviewScheduleLabel,
  getJobInterviewSchedules,
  sortInterviewSchedules,
  syncLegacyInterviewFields,
  updateInterviewScheduleDateTime,
} from "@/features/jobs/lib/interview-schedules";
import type { InterviewSchedule, InterviewScheduleKind } from "@/features/jobs/types/interview-schedule";
import {
  INTERVIEW_SCHEDULE_KIND_LABELS,
  STATUS_TO_SCHEDULE_KIND,
} from "@/features/jobs/types/interview-schedule";
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

type StatusInterviewStage = keyof typeof STATUS_TO_SCHEDULE_KIND;

function getStatusInterviewStage(status: JobStatus): StatusInterviewStage | null {
  if (status in STATUS_TO_SCHEDULE_KIND) {
    return status as StatusInterviewStage;
  }
  return null;
}

export type ListEditableInterview = {
  scheduleId: string;
  stage: LatestInterview["stage"] | "other";
  label: string;
  field?: InterviewDateField;
  at: string | null;
  url: string | null;
};

function findScheduleForStatus(job: Job, stage: StatusInterviewStage): InterviewSchedule | null {
  return getJobInterviewSchedules(job).find((schedule) => schedule.kind === stage) ?? null;
}

/** 一覧で面接日時を表示しないステータス（内定後は次回面接がないため） */
export function shouldHideListInterviewDateTime(job: Job): boolean {
  return job.status === "offer";
}

/** 一覧で編集対象となる面接日時（現在の選考ステータスに対応する段階）を返す。 */
export function getListEditableInterview(job: Job): ListEditableInterview {
  if (shouldHideListInterviewDateTime(job)) {
    return {
      scheduleId: "",
      stage: "first_interview",
      label: INTERVIEW_SCHEDULE_KIND_LABELS.first_interview,
      field: "first_interview_at",
      at: null,
      url: null,
    };
  }

  const stage = getStatusInterviewStage(job.status);
  if (!stage) {
    return {
      scheduleId: "",
      stage: "first_interview",
      label: "面接日時",
      at: null,
      url: null,
    };
  }

  const field = STAGE_TO_FIELD[stage];
  const schedule = findScheduleForStatus(job, stage);
  const at = schedule?.scheduled_at ?? job[field] ?? null;
  const url = schedule?.url ?? getInterviewUrl(job, stage);

  if (schedule) {
    return {
      scheduleId: schedule.id,
      stage,
      label: getInterviewScheduleLabel(schedule),
      field,
      at,
      url,
    };
  }

  return {
    scheduleId: "",
    stage,
    label: INTERVIEW_SCHEDULE_KIND_LABELS[stage],
    field,
    at,
    url,
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
    ...syncLegacyInterviewFields(sorted),
  };

  if (target && target.kind !== "other" && target.kind !== "third_interview") {
    input[STAGE_TO_FIELD[target.kind as LatestInterview["stage"]]] = scheduledAt;
  }

  return input;
}

/** 一覧インライン編集用（スケジュール未作成時は種別で upsert） */
export function buildListInterviewDateUpdateInput(
  job: Job,
  editable: ListEditableInterview,
  scheduledAt: string | null,
): UpdateJobInput {
  if (!editable.field) {
    return {};
  }

  if (editable.scheduleId) {
    return buildInterviewDateUpdateInput(job, editable.scheduleId, scheduledAt);
  }

  const kind = editable.stage as InterviewScheduleKind;
  const schedules = getJobInterviewSchedules(job);
  const existing = schedules.find((schedule) => schedule.kind === kind);

  const updatedSchedules = sortInterviewSchedules(
    existing
      ? schedules.map((schedule) =>
          schedule.kind === kind ? { ...schedule, scheduled_at: scheduledAt } : schedule,
        )
      : [...schedules, { ...createEmptyInterviewSchedule(kind), scheduled_at: scheduledAt }],
  );

  return {
    interview_schedules: updatedSchedules,
    ...syncLegacyInterviewFields(updatedSchedules),
  };
}
