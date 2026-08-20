import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_JOB_LIST_FILTERS,
  JOB_LIST_FILTERS_STORAGE_KEY,
  JOB_LIST_ENDED_FILTER,
  JOB_LIST_IN_PROGRESS_FILTER,
  JOB_LIST_STATUS_FILTER_GROUPS,
  JOB_LIST_TOP_LEVEL_STATUSES,
  jobListFiltersToSearchParams,
  matchesJobStatusFilter,
  parseJobListFiltersFromSearchParams,
  readJobListFiltersFromStorage,
  resolveJobListFilters,
  writeJobListFiltersToStorage,
} from "./job-list-filters";
import { JOB_STATUSES } from "@/features/jobs/types/job";

describe("job-list-filters", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("URLパラメータを優先してフィルタを復元する", () => {
    const params = new URLSearchParams("sort=interview_at_asc&status=first_interview");
    const fromUrl = parseJobListFiltersFromSearchParams(params);

    writeJobListFiltersToStorage({
      sort: "updated_at_asc",
      status: "all",
    });

    expect(resolveJobListFilters(fromUrl, readJobListFiltersFromStorage())).toEqual({
      sort: "interview_at_asc",
      status: "first_interview",
    });
  });

  it("URLに値がない場合はsessionStorageから復元する", () => {
    writeJobListFiltersToStorage({
      sort: "interview_at_asc",
      status: "document_screening",
    });

    expect(
      resolveJobListFilters(
        parseJobListFiltersFromSearchParams(new URLSearchParams()),
        readJobListFiltersFromStorage(),
      ),
    ).toEqual({
      sort: "interview_at_asc",
      status: "document_screening",
    });
  });

  it("無効な値は無視してデフォルトにフォールバックする", () => {
    const params = new URLSearchParams("sort=invalid&status=unknown");

    expect(resolveJobListFilters(parseJobListFiltersFromSearchParams(params), {})).toEqual(
      DEFAULT_JOB_LIST_FILTERS,
    );
  });

  it("デフォルト以外の値だけURLパラメータに含める", () => {
    const params = jobListFiltersToSearchParams({
      sort: "interview_at_asc",
      status: "all",
    });

    expect(params.toString()).toBe("sort=interview_at_asc");
  });

  it("sessionStorageへの保存と読み込みができる", () => {
    writeJobListFiltersToStorage({
      sort: "display_order_asc",
      status: "offer",
    });

    expect(sessionStorage.getItem(JOB_LIST_FILTERS_STORAGE_KEY)).toBe(
      JSON.stringify({ sort: "display_order_asc", status: "offer" }),
    );
    expect(readJobListFiltersFromStorage()).toEqual({
      sort: "display_order_asc",
      status: "offer",
    });
  });

  it("トップレベルと各グループで全ステータスをカバーする", () => {
    const groupedStatuses = JOB_LIST_STATUS_FILTER_GROUPS.flatMap((group) => group.statuses);
    expect(JOB_LIST_TOP_LEVEL_STATUSES).toEqual(["not_applied"]);
    expect(JOB_LIST_STATUS_FILTER_GROUPS.map((group) => group.label)).toEqual(["進行中", "終了"]);
    expect(groupedStatuses).toContain("withdrawn");
    expect([...JOB_LIST_TOP_LEVEL_STATUSES, ...groupedStatuses]).toEqual(JOB_STATUSES);
  });

  it("in_progress フィルターは進行中5ステータスに一致する", () => {
    expect(matchesJobStatusFilter("document_screening", JOB_LIST_IN_PROGRESS_FILTER)).toBe(true);
    expect(matchesJobStatusFilter("casual_interview", JOB_LIST_IN_PROGRESS_FILTER)).toBe(true);
    expect(matchesJobStatusFilter("first_interview", JOB_LIST_IN_PROGRESS_FILTER)).toBe(true);
    expect(matchesJobStatusFilter("not_applied", JOB_LIST_IN_PROGRESS_FILTER)).toBe(false);
    expect(matchesJobStatusFilter("offer", JOB_LIST_IN_PROGRESS_FILTER)).toBe(false);
  });

  it("ended フィルターは終了3ステータスに一致する", () => {
    expect(matchesJobStatusFilter("offer", JOB_LIST_ENDED_FILTER)).toBe(true);
    expect(matchesJobStatusFilter("rejected", JOB_LIST_ENDED_FILTER)).toBe(true);
    expect(matchesJobStatusFilter("withdrawn", JOB_LIST_ENDED_FILTER)).toBe(true);
    expect(matchesJobStatusFilter("first_interview", JOB_LIST_ENDED_FILTER)).toBe(false);
  });

  it("ended を URL パラメータから復元できる", () => {
    const params = new URLSearchParams("status=ended");
    expect(parseJobListFiltersFromSearchParams(params)).toEqual({
      status: JOB_LIST_ENDED_FILTER,
    });
  });

  it("in_progress を URL パラメータから復元できる", () => {
    const params = new URLSearchParams("status=in_progress");
    expect(parseJobListFiltersFromSearchParams(params)).toEqual({
      status: JOB_LIST_IN_PROGRESS_FILTER,
    });
  });
});
