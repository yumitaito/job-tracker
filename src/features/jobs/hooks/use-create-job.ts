import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJob } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJob,
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
