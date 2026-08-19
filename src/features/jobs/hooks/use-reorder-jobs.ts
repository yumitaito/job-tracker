import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderJobs } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";
import { applyJobOrder, normalizeOrderedJobIds } from "@/features/jobs/lib/job-order";
import type { Job, JobSortOption } from "@/features/jobs/types/job";

export function useReorderJobs(sort: JobSortOption, jobs: Job[]) {
  const queryClient = useQueryClient();
  const listKey = jobKeys.list(sort);

  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderJobs(normalizeOrderedJobIds(jobs, orderedIds)),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: jobKeys.lists() });

      const previous = queryClient.getQueryData<Job[]>(listKey);
      if (previous) {
        const normalizedIds = normalizeOrderedJobIds(jobs, orderedIds);
        queryClient.setQueryData(listKey, applyJobOrder(previous, normalizedIds));
      }

      return { previous, listKey };
    },
    onError: (_error, _orderedIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
