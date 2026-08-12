export type JobStatus =
  | "not_applied"
  | "document_screening"
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
  first_interview: "一次面接",
  second_interview: "二次面接",
  final_interview: "最終面接",
  offer: "内定",
  rejected: "不採用",
  withdrawn: "辞退",
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
  first_interview_at: string | null;
  second_interview_at: string | null;
  final_interview_at: string | null;
  location: string | null;
  technologies: string[] | null;
  notes: string | null;
  min_salary: number | null;
  max_salary: number | null;
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
  first_interview_at: string | null;
  second_interview_at: string | null;
  final_interview_at: string | null;
  location: string | null;
  technologies: string[] | null;
  notes: string | null;
  min_salary: number | null;
  max_salary: number | null;
};

/** 求人更新時にSupabaseへ送るペイロード */
export type UpdateJobInput = Partial<CreateJobInput>;

export type JobSortOption =
  | "application_date_desc"
  | "application_date_asc"
  | "updated_at_desc"
  | "updated_at_asc"
  | "company_name_asc";

export const JOB_SORT_LABELS: Record<JobSortOption, string> = {
  application_date_desc: "応募日が新しい順",
  application_date_asc: "応募日が古い順",
  updated_at_desc: "更新日が新しい順",
  updated_at_asc: "更新日が古い順",
  company_name_asc: "企業名（昇順）",
};

export type JobStatusFilter = "all" | JobStatus;
