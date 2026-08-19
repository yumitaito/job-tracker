import type { Job } from "@/features/jobs/types/job";
import {
  INTERVIEW_SCHEDULE_KIND_LABELS,
  type InterviewSchedule,
  type InterviewScheduleKind,
} from "@/features/jobs/types/interview-schedule";

const KIND_ORDER: Record<InterviewScheduleKind, number> = {
  casual_interview: 1,
  first_interview: 2,
  second_interview: 3,
  third_interview: 4,
  final_interview: 5,
  other: 6,
};

const LEGACY_AT_FIELDS = {
  casual_interview: "casual_interview_at",
  first_interview: "first_interview_at",
  second_interview: "second_interview_at",
  final_interview: "final_interview_at",
} as const satisfies Partial<Record<InterviewScheduleKind, keyof Job>>;

const LEGACY_URL_FIELDS = {
  casual_interview: "casual_interview_url",
  first_interview: "first_interview_url",
  second_interview: "second_interview_url",
  final_interview: "final_interview_url",
} as const satisfies Partial<Record<InterviewScheduleKind, keyof Job>>;

type LegacyInterviewFields = Pick<
  Job,
  | "casual_interview_at"
  | "first_interview_at"
  | "second_interview_at"
  | "final_interview_at"
  | "casual_interview_url"
  | "first_interview_url"
  | "second_interview_url"
  | "final_interview_url"
>;

function createScheduleId(): string {
  return crypto.randomUUID();
}

function normalizeSchedule(raw: unknown): InterviewSchedule | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const kind = item.kind;
  if (typeof kind !== "string" || !(kind in KIND_ORDER)) return null;

  const scheduledAt = item.scheduled_at;
  const url = item.url;
  const customLabel = item.custom_label;

  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : createScheduleId(),
    kind: kind as InterviewScheduleKind,
    custom_label:
      typeof customLabel === "string" && customLabel.trim().length > 0 ? customLabel.trim() : null,
    scheduled_at:
      typeof scheduledAt === "string" && scheduledAt.length > 0 ? scheduledAt : null,
    url: typeof url === "string" && url.trim().length > 0 ? url.trim() : null,
  };
}

function schedulesFromLegacyColumns(job: Job): InterviewSchedule[] {
  const schedules: InterviewSchedule[] = [];
  const kinds = [
    "casual_interview",
    "first_interview",
    "second_interview",
    "final_interview",
  ] as const;

  for (const kind of kinds) {
    const atField = LEGACY_AT_FIELDS[kind];
    const urlField = LEGACY_URL_FIELDS[kind];
    const scheduledAt = job[atField];
    const url = job[urlField];
    if (scheduledAt || url) {
      schedules.push({
        id: createScheduleId(),
        kind,
        scheduled_at: scheduledAt,
        url,
      });
    }
  }

  return schedules;
}

/** 求人から選考スケジュール一覧を取得する（JSON優先、なければ旧カラムから生成） */
export function getJobInterviewSchedules(job: Job): InterviewSchedule[] {
  const raw = job.interview_schedules;
  if (Array.isArray(raw) && raw.length > 0) {
    const parsed = raw
      .map(normalizeSchedule)
      .filter((schedule): schedule is InterviewSchedule => schedule !== null);
    if (parsed.length > 0) {
      return sortInterviewSchedules(parsed);
    }
  }

  return sortInterviewSchedules(schedulesFromLegacyColumns(job));
}

export function sortInterviewSchedules(schedules: InterviewSchedule[]): InterviewSchedule[] {
  return [...schedules].sort((left, right) => {
    const kindDiff = KIND_ORDER[left.kind] - KIND_ORDER[right.kind];
    if (kindDiff !== 0) return kindDiff;
    return left.id.localeCompare(right.id);
  });
}

export function getInterviewScheduleLabel(schedule: InterviewSchedule): string {
  if (schedule.kind === "other") {
    return schedule.custom_label?.trim() || INTERVIEW_SCHEDULE_KIND_LABELS.other;
  }
  return INTERVIEW_SCHEDULE_KIND_LABELS[schedule.kind];
}

/** 選考スケジュールから旧8カラムへ同期（Edge Function / 一覧インライン編集互換） */
export function syncLegacyInterviewFields(
  schedules: InterviewSchedule[],
): LegacyInterviewFields {
  const legacy: LegacyInterviewFields = {
    casual_interview_at: null,
    first_interview_at: null,
    second_interview_at: null,
    final_interview_at: null,
    casual_interview_url: null,
    first_interview_url: null,
    second_interview_url: null,
    final_interview_url: null,
  };

  for (const schedule of schedules) {
    if (!(schedule.kind in LEGACY_AT_FIELDS)) continue;

    const atField = LEGACY_AT_FIELDS[schedule.kind as keyof typeof LEGACY_AT_FIELDS];
    const urlField = LEGACY_URL_FIELDS[schedule.kind as keyof typeof LEGACY_URL_FIELDS];

    if (schedule.scheduled_at) {
      legacy[atField] = schedule.scheduled_at;
    }
    if (schedule.url) {
      legacy[urlField] = schedule.url;
    }
  }

  return legacy;
}

export function createEmptyInterviewSchedule(kind: InterviewScheduleKind): InterviewSchedule {
  return {
    id: createScheduleId(),
    kind,
    custom_label: kind === "other" ? "" : null,
    scheduled_at: null,
    url: null,
  };
}

export function canAddInterviewScheduleKind(
  schedules: InterviewSchedule[],
  kind: InterviewScheduleKind,
): boolean {
  if (kind === "other") return true;
  return !schedules.some((schedule) => schedule.kind === kind);
}

export function getAvailableInterviewScheduleKinds(
  schedules: InterviewSchedule[],
): InterviewScheduleKind[] {
  return (Object.keys(KIND_ORDER) as InterviewScheduleKind[]).filter((kind) =>
    canAddInterviewScheduleKind(schedules, kind),
  );
}

/** 日時が設定されている最も進んだ選考を返す */
export function getLatestScheduledInterview(
  job: Job,
): { schedule: InterviewSchedule; at: string } | null {
  const schedules = getJobInterviewSchedules(job).filter((schedule) => schedule.scheduled_at);
  if (schedules.length === 0) return null;

  const latest = schedules.reduce((current, candidate) =>
    KIND_ORDER[candidate.kind] >= KIND_ORDER[current.kind] ? candidate : current,
  );

  return latest.scheduled_at
    ? { schedule: latest, at: latest.scheduled_at }
    : null;
}

/** 日時が設定されている選考をすべて返す */
export function getScheduledInterviews(job: Job): { schedule: InterviewSchedule; at: string }[] {
  return getJobInterviewSchedules(job)
    .filter((schedule) => schedule.scheduled_at)
    .map((schedule) => ({ schedule, at: schedule.scheduled_at! }));
}

export function updateInterviewScheduleDateTime(
  schedules: InterviewSchedule[],
  scheduleId: string,
  scheduledAt: string | null,
): InterviewSchedule[] {
  return schedules.map((schedule) =>
    schedule.id === scheduleId ? { ...schedule, scheduled_at: scheduledAt } : schedule,
  );
}

export function getInterviewScheduleByKind(
  job: Job,
  kind: InterviewScheduleKind,
): InterviewSchedule | null {
  return getJobInterviewSchedules(job).find((schedule) => schedule.kind === kind) ?? null;
}
