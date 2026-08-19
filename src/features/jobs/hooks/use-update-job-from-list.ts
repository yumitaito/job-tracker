import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateJob } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/query-keys";
import type { Job, UpdateJobInput } from "@/features/jobs/types/job";

function applyJobUpdate(job: Job, input: UpdateJobInput): Job {
  return {
    ...job,
    ...input,
    updated_at: new Date().toISOString(),
  };
}

export function useUpdateJobFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateJobInput }) => updateJob(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: jobKeys.lists() });

      const previousLists = queryClient.getQueriesData<Job[]>({ queryKey: jobKeys.lists() });

      queryClient.setQueriesData<Job[]>({ queryKey: jobKeys.lists() }, (jobs) => {
        if (!jobs) return jobs;
        return jobs.map((job) => (job.id === id ? applyJobUpdate(job, input) : job));
      });

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, jobs]) => {
        queryClient.setQueryData(queryKey, jobs);
      });
    },
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.setQueriesData<Job[]>({ queryKey: jobKeys.lists() }, (jobs) => {
        if (!jobs) return jobs;
        return jobs.map((current) => (current.id === job.id ? job : current));
      });
    },
  });
}
