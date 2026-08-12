import type { JobSortOption } from "@/features/jobs/types/job";

export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (sort: JobSortOption) => [...jobKeys.lists(), { sort }] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};
