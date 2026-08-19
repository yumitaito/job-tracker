import { supabase } from "@/lib/supabase";
import { sortJobsByUpcomingInterview } from "@/features/jobs/lib/interview";
import { toDisplayOrderUpdates } from "@/features/jobs/lib/job-order";
import type { CreateJobInput, Job, JobSortOption, UpdateJobInput } from "@/features/jobs/types/job";

const TABLE = "jobs";

type DbJobSortOption = Exclude<JobSortOption, "interview_at_asc">;

const SORT_COLUMN: Record<
  DbJobSortOption,
  { column: "display_order" | "application_date" | "updated_at"; ascending: boolean }
> = {
  display_order_asc: { column: "display_order", ascending: true },
  application_date_desc: { column: "application_date", ascending: false },
  application_date_asc: { column: "application_date", ascending: true },
  updated_at_desc: { column: "updated_at", ascending: false },
  updated_at_asc: { column: "updated_at", ascending: true },
};

async function nextDisplayOrder(): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.display_order ?? -1) + 1;
}

/** 求人一覧を取得する。ステータス絞り込みは件数がまとまった量ではないため、
 *  クライアント側（use-jobs）で行い、ここでは全件取得＋並び替えのみを担う。 */
export async function fetchJobs(sort: JobSortOption): Promise<Job[]> {
  if (sort === "interview_at_asc") {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw new Error(error.message);
    return sortJobsByUpcomingInterview(data ?? []);
  }

  const { column, ascending } = SORT_COLUMN[sort];

  let query = supabase.from(TABLE).select("*");

  if (column === "application_date") {
    query = query.order(column, { ascending, nullsFirst: false });
  } else {
    query = query.order(column, { ascending });
  }

  const { data, error } = await query;

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
  const display_order = await nextDisplayOrder();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, display_order })
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

/** 一覧の手動並び替え結果を display_order に保存する（RLS により本人の求人のみ更新） */
export async function reorderJobs(orderedIds: string[]): Promise<void> {
  const updates = toDisplayOrderUpdates(orderedIds);
  const results = await Promise.all(
    updates.map(({ id, display_order }) =>
      supabase.from(TABLE).update({ display_order }).eq("id", id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}
