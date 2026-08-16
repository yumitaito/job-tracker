import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderJobs } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";
import { applyJobOrder } from "@/features/jobs/lib/job-order";
import type { Job, JobSortOption } from "@/features/jobs/types/job";

export function useReorderJobs(sort: JobSortOption) {
  const queryClient = useQueryClient();
  const listKey = jobKeys.list(sort);

  return useMutation({
    mutationFn: reorderJobs,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: jobKeys.lists() });

      const previous = queryClient.getQueryData<Job[]>(listKey);
      if (previous) {
        queryClient.setQueryData(listKey, applyJobOrder(previous, orderedIds));
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
