import { supabase } from "@/lib/supabase";

/** Edge Function `fetch-job-metadata` が返す、URLから抽出した求人情報 */
export type JobMetadata = {
  company_name?: string;
  position?: string;
  location?: string;
  employment_type?: string;
  min_salary?: number;
  max_salary?: number;
  technologies?: string[];
};

type FetchJobMetadataResponse =
  | { ok: true; source: "structured" | "meta" | "none"; data: JobMetadata }
  | { ok: false; error: string };

/** 応募先URLから、企業名・職種・勤務地などをベストエフォートで取得する */
export async function fetchJobMetadata(url: string): Promise<JobMetadata> {
  const { data, error } = await supabase.functions.invoke<FetchJobMetadataResponse>(
    "fetch-job-metadata",
    { body: { url } },
  );

  if (error) throw new Error(error.message);
  if (!data) throw new Error("求人情報を取得できませんでした");
  if (!data.ok) throw new Error(data.error);

  return data.data;
}
