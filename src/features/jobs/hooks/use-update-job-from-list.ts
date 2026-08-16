import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateJob } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";
import type { UpdateJobInput } from "@/features/jobs/types/job";

export function useUpdateJobFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateJobInput }) => updateJob(id, input),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
