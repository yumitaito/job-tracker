export type JobStatus = "not_applied" | "applied";

export const JOB_STATUSES: JobStatus[] = ["not_applied", "applied"];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  not_applied: "未応募",
  applied: "応募済み",
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
