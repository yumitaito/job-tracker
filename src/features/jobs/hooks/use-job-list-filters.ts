import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_JOB_LIST_FILTERS,
  jobListFiltersToSearchParams,
  parseJobListFiltersFromSearchParams,
  readJobListFiltersFromStorage,
  resolveJobListFilters,
  writeJobListFiltersToStorage,
  type JobListFilters,
} from "@/features/jobs/lib/job-list-filters";
import type { JobSortOption, JobStatusFilter } from "@/features/jobs/types/job";

export function useJobListFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const fromUrl = parseJobListFiltersFromSearchParams(searchParams);
    const fromStorage = readJobListFiltersFromStorage();
    return resolveJobListFilters(fromUrl, fromStorage);
  }, [searchParams]);

  useEffect(() => {
    writeJobListFiltersToStorage(filters);
  }, [filters]);

  useEffect(() => {
    const fromUrl = parseJobListFiltersFromSearchParams(searchParams);
    const hasUrlFilters = Boolean(fromUrl.sort || fromUrl.status);
    if (hasUrlFilters) return;

    const fromStorage = readJobListFiltersFromStorage();
    const resolved = resolveJobListFilters({}, fromStorage);
    const isDefault =
      resolved.sort === DEFAULT_JOB_LIST_FILTERS.sort &&
      resolved.status === DEFAULT_JOB_LIST_FILTERS.status;

    if (isDefault) return;

    setSearchParams(jobListFiltersToSearchParams(resolved), { replace: true });
  }, [searchParams, setSearchParams]);

  const updateFilters = useCallback(
    (partial: Partial<JobListFilters>) => {
      const next = { ...filters, ...partial };
      writeJobListFiltersToStorage(next);
      setSearchParams(jobListFiltersToSearchParams(next), { replace: true });
    },
    [filters, setSearchParams],
  );

  const setSort = useCallback(
    (sort: JobSortOption) => {
      updateFilters({ sort });
    },
    [updateFilters],
  );

  const setStatus = useCallback(
    (status: JobStatusFilter) => {
      updateFilters({ status });
    },
    [updateFilters],
  );

  return {
    sort: filters.sort,
    status: filters.status,
    setSort,
    setStatus,
  };
}
