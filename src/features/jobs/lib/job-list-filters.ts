import {
  JOB_SORT_LABELS,
  JOB_STATUSES,
  type JobSortOption,
  type JobStatus,
  type JobStatusFilter,
} from "@/features/jobs/types/job";

export const JOB_LIST_FILTERS_STORAGE_KEY = "job-tracker-list-filters";

/** 一覧フィルターのトップレベル（グループ外） */
export const JOB_LIST_TOP_LEVEL_STATUSES: JobStatus[] = ["not_applied"];

/** 「進行中」全体フィルターで絞り込むステータス（ドロップダウン選択肢と同一） */
export const JOB_LIST_IN_PROGRESS_STATUSES: JobStatus[] = [
  "document_screening",
  "casual_interview",
  "first_interview",
  "second_interview",
  "final_interview",
];

export const JOB_LIST_IN_PROGRESS_FILTER = "in_progress" as const;

/** 「終了」全体フィルターで絞り込むステータス（ドロップダウン選択肢と同一） */
export const JOB_LIST_ENDED_STATUSES: JobStatus[] = ["offer", "rejected", "withdrawn"];

export const JOB_LIST_ENDED_FILTER = "ended" as const;

export type JobListGroupStatusFilter =
  | typeof JOB_LIST_IN_PROGRESS_FILTER
  | typeof JOB_LIST_ENDED_FILTER;

/** 一覧フィルターのグループ表示（ドロップダウン） */
export const JOB_LIST_STATUS_FILTER_GROUPS: {
  label: string;
  statuses: JobStatus[];
  /** ピル本体クリック時に適用する複合フィルター */
  groupFilter: JobListGroupStatusFilter;
}[] = [
  {
    label: "進行中",
    statuses: JOB_LIST_IN_PROGRESS_STATUSES,
    groupFilter: JOB_LIST_IN_PROGRESS_FILTER,
  },
  {
    label: "終了",
    statuses: JOB_LIST_ENDED_STATUSES,
    groupFilter: JOB_LIST_ENDED_FILTER,
  },
];

export type JobListFilters = {
  sort: JobSortOption;
  status: JobStatusFilter;
};

export const DEFAULT_JOB_LIST_FILTERS: JobListFilters = {
  sort: "application_date_desc",
  status: "all",
};

const SORT_OPTIONS = new Set(Object.keys(JOB_SORT_LABELS) as JobSortOption[]);
const STATUS_FILTERS = new Set<JobStatusFilter>([
  "all",
  JOB_LIST_IN_PROGRESS_FILTER,
  JOB_LIST_ENDED_FILTER,
  ...JOB_STATUSES,
]);

export function matchesJobStatusFilter(jobStatus: JobStatus, filter: JobStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === JOB_LIST_IN_PROGRESS_FILTER) {
    return JOB_LIST_IN_PROGRESS_STATUSES.includes(jobStatus);
  }
  if (filter === JOB_LIST_ENDED_FILTER) {
    return JOB_LIST_ENDED_STATUSES.includes(jobStatus);
  }
  return jobStatus === filter;
}

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
