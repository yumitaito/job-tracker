/** 選考スケジュールの種別（選考ステータスと同名のもの + 三次面接 + その他） */
export type InterviewScheduleKind =
  | "casual_interview"
  | "first_interview"
  | "second_interview"
  | "third_interview"
  | "final_interview"
  | "other";

export const INTERVIEW_SCHEDULE_KINDS: InterviewScheduleKind[] = [
  "casual_interview",
  "first_interview",
  "second_interview",
  "third_interview",
  "final_interview",
  "other",
];

export const INTERVIEW_SCHEDULE_KIND_LABELS: Record<InterviewScheduleKind, string> = {
  casual_interview: "カジュアル面談",
  first_interview: "一次面接",
  second_interview: "二次面接",
  third_interview: "三次面接",
  final_interview: "最終面接",
  other: "その他",
};

/** DB / API で保存する選考スケジュール1件 */
export type InterviewSchedule = {
  id: string;
  kind: InterviewScheduleKind;
  /** kind が other のときの表示名 */
  custom_label?: string | null;
  scheduled_at?: string | null;
  url?: string | null;
};

/** 選考ステータスと対応するスケジュール種別 */
export const STATUS_TO_SCHEDULE_KIND = {
  casual_interview: "casual_interview",
  first_interview: "first_interview",
  second_interview: "second_interview",
  final_interview: "final_interview",
} as const;
