import type { InterviewSchedule } from "@/features/jobs/types/interview-schedule";

export type JobStatus =
  | "not_applied"
  | "document_screening"
  | "casual_interview"
  | "first_interview"
  | "second_interview"
  | "final_interview"
  | "offer"
  | "rejected"
  | "withdrawn";

/** 選考の進行順（フォームの選択肢順・フィルタピル表示順に反映される） */
export const JOB_STATUSES: JobStatus[] = [
  "not_applied",
  "document_screening",
  "casual_interview",
  "first_interview",
  "second_interview",
  "final_interview",
  "offer",
  "rejected",
  "withdrawn",
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  not_applied: "未応募",
  document_screening: "書類選考中",
  casual_interview: "カジュアル面接",
  first_interview: "一次面接",
  second_interview: "二次面接",
  final_interview: "最終面接",
  offer: "内定",
  rejected: "不採用",
  withdrawn: "辞退",
};

export type DesireLevel = "high" | "medium" | "low";

export const DESIRE_LEVELS: DesireLevel[] = ["high", "medium", "low"];

export const DESIRE_LEVEL_LABELS: Record<DesireLevel, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

/** Supabaseの`jobs`テーブル1件分を表すエンティティ型 */
export type Job = {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  employment_type: string | null;
  application_url: string | null;
  application_date: string | null;
  status: JobStatus;
  desire_level: DesireLevel;
  casual_interview_at: string | null;
  first_interview_at: string | null;
  second_interview_at: string | null;
  final_interview_at: string | null;
  casual_interview_url: string | null;
  first_interview_url: string | null;
  second_interview_url: string | null;
  final_interview_url: string | null;
  interview_schedules: InterviewSchedule[] | null;
  location: string | null;
  technologies: string[] | null;
  notes: string | null;
  min_salary: number | null;
  max_salary: number | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

/** 求人登録時にSupabaseへ送るペイロード */
export type CreateJobInput = {
  company_name: string;
  position: string;
  employment_type: string | null;
  application_url: string | null;
  application_date: string | null;
  status: JobStatus;
  desire_level: DesireLevel;
  casual_interview_at: string | null;
  first_interview_at: string | null;
  second_interview_at: string | null;
  final_interview_at: string | null;
  casual_interview_url: string | null;
  first_interview_url: string | null;
  second_interview_url: string | null;
  final_interview_url: string | null;
  interview_schedules: InterviewSchedule[] | null;
  location: string | null;
  technologies: string[] | null;
  notes: string | null;
  min_salary: number | null;
  max_salary: number | null;
};

/** 求人更新時にSupabaseへ送るペイロード */
export type UpdateJobInput = Partial<CreateJobInput>;

export type JobSortOption =
  | "display_order_asc"
  | "interview_at_asc"
  | "application_date_desc"
  | "application_date_asc"
  | "updated_at_desc"
  | "updated_at_asc";

export const JOB_SORT_LABELS: Record<JobSortOption, string> = {
  display_order_asc: "カスタム順",
  interview_at_asc: "面接日時が近い順",
  application_date_desc: "応募日が新しい順",
  application_date_asc: "応募日が古い順",
  updated_at_desc: "更新日が新しい順",
  updated_at_asc: "更新日が古い順",
};

export type JobStatusFilter = "all" | JobStatus;
