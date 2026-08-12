import { useQuery } from "@tanstack/react-query";
import { fetchJobById } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: jobKeys.detail(id ?? ""),
    queryFn: () => fetchJobById(id as string),
    enabled: Boolean(id),
  });
}
