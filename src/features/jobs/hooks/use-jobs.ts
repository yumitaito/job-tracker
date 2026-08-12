import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";
import type { JobSortOption } from "@/features/jobs/types/job";

export function useJobs(sort: JobSortOption) {
  return useQuery({
    queryKey: jobKeys.list(sort),
    queryFn: () => fetchJobs(sort),
  });
}
