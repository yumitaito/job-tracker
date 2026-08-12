import { supabase } from "@/lib/supabase";
import type { CreateJobInput, Job, JobSortOption, UpdateJobInput } from "@/features/jobs/types/job";

const TABLE = "jobs";

const SORT_COLUMN: Record<
  JobSortOption,
  { column: "application_date" | "updated_at" | "company_name"; ascending: boolean }
> = {
  application_date_desc: { column: "application_date", ascending: false },
  application_date_asc: { column: "application_date", ascending: true },
  updated_at_desc: { column: "updated_at", ascending: false },
  updated_at_asc: { column: "updated_at", ascending: true },
  company_name_asc: { column: "company_name", ascending: true },
};

/** 求人一覧を取得する。ステータス絞り込みは件数がまとまった量ではないため、
 *  クライアント側（use-jobs）で行い、ここでは全件取得＋並び替えのみを担う。 */
export async function fetchJobs(sort: JobSortOption): Promise<Job[]> {
  const { column, ascending } = SORT_COLUMN[sort];

  // application_dateはnull（未入力）を許容するため、常にnullを末尾に回す
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order(column, { ascending, nullsFirst: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
