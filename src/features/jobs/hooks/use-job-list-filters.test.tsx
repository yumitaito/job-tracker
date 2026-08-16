import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { JOB_LIST_FILTERS_STORAGE_KEY } from "@/features/jobs/lib/job-list-filters";
import { useJobListFilters } from "./use-job-list-filters";

function createWrapper(initialEntry = "/jobs") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

function useTestLocation() {
  return useLocation();
}

describe("useJobListFilters", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("sessionStorageの値を復元してURLにも反映する", async () => {
    sessionStorage.setItem(
      JOB_LIST_FILTERS_STORAGE_KEY,
      JSON.stringify({ sort: "interview_at_asc", status: "all" }),
    );

    const { result } = renderHook(
      () => ({
        filters: useJobListFilters(),
        location: useTestLocation(),
      }),
      { wrapper: createWrapper("/jobs") },
    );

    await act(async () => {});

    expect(result.current.filters.sort).toBe("interview_at_asc");
    expect(result.current.location.search).toBe("?sort=interview_at_asc");
  });

  it("並び順変更時にsessionStorageへ保存する", async () => {
    const { result } = renderHook(() => useJobListFilters(), {
      wrapper: createWrapper("/jobs"),
    });

    await act(async () => {
      result.current.setSort("interview_at_asc");
    });

    expect(result.current.sort).toBe("interview_at_asc");
    expect(JSON.parse(sessionStorage.getItem(JOB_LIST_FILTERS_STORAGE_KEY) ?? "{}")).toEqual({
      sort: "interview_at_asc",
      status: "all",
    });
  });

  it("ステータス変更時も保持される", async () => {
    const { result } = renderHook(() => useJobListFilters(), {
      wrapper: createWrapper("/jobs?sort=interview_at_asc"),
    });

    await act(async () => {
      result.current.setStatus("first_interview");
    });

    expect(result.current.status).toBe("first_interview");
    expect(JSON.parse(sessionStorage.getItem(JOB_LIST_FILTERS_STORAGE_KEY) ?? "{}")).toEqual({
      sort: "interview_at_asc",
      status: "first_interview",
    });
  });
});
