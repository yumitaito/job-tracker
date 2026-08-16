import {
  JOB_SORT_LABELS,
  JOB_STATUSES,
  type JobSortOption,
  type JobStatusFilter,
} from "@/features/jobs/types/job";

export const JOB_LIST_FILTERS_STORAGE_KEY = "job-tracker-list-filters";

export type JobListFilters = {
  sort: JobSortOption;
  status: JobStatusFilter;
};

export const DEFAULT_JOB_LIST_FILTERS: JobListFilters = {
  sort: "application_date_desc",
  status: "all",
};

const SORT_OPTIONS = new Set(Object.keys(JOB_SORT_LABELS) as JobSortOption[]);
const STATUS_FILTERS = new Set<JobStatusFilter>(["all", ...JOB_STATUSES]);

export function isJobSortOption(value: string): value is JobSortOption {
  return SORT_OPTIONS.has(value as JobSortOption);
}

export function isJobStatusFilter(value: string): value is JobStatusFilter {
  return STATUS_FILTERS.has(value as JobStatusFilter);
}

export function parseJobListFiltersFromSearchParams(
  params: URLSearchParams,
): Partial<JobListFilters> {
  const parsed: Partial<JobListFilters> = {};
  const sort = params.get("sort");
  const status = params.get("status");

  if (sort && isJobSortOption(sort)) {
    parsed.sort = sort;
  }

  if (status && isJobStatusFilter(status)) {
    parsed.status = status;
  }

  return parsed;
}

export function readJobListFiltersFromStorage(): Partial<JobListFilters> {
  if (typeof sessionStorage === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(JOB_LIST_FILTERS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Partial<JobListFilters>;
    const result: Partial<JobListFilters> = {};

    if (parsed.sort && isJobSortOption(parsed.sort)) {
      result.sort = parsed.sort;
    }

    if (parsed.status && isJobStatusFilter(parsed.status)) {
      result.status = parsed.status;
    }

    return result;
  } catch {
    return {};
  }
}

export function resolveJobListFilters(
  fromUrl: Partial<JobListFilters>,
  fromStorage: Partial<JobListFilters>,
): JobListFilters {
  return {
    sort: fromUrl.sort ?? fromStorage.sort ?? DEFAULT_JOB_LIST_FILTERS.sort,
    status: fromUrl.status ?? fromStorage.status ?? DEFAULT_JOB_LIST_FILTERS.status,
  };
}

export function writeJobListFiltersToStorage(filters: JobListFilters): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(JOB_LIST_FILTERS_STORAGE_KEY, JSON.stringify(filters));
}

export function jobListFiltersToSearchParams(filters: JobListFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.sort !== DEFAULT_JOB_LIST_FILTERS.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.status !== DEFAULT_JOB_LIST_FILTERS.status) {
    params.set("status", filters.status);
  }

  return params;
}
