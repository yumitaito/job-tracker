import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteJob } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: jobKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
