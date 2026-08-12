import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateJob } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";
import type { UpdateJobInput } from "@/features/jobs/types/job";

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateJobInput) => updateJob(id, input),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
