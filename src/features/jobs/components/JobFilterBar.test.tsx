import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobFilterBar } from "./JobFilterBar";
import {
  JOB_LIST_STATUS_FILTER_GROUPS,
  JOB_LIST_TOP_LEVEL_STATUSES,
} from "@/features/jobs/lib/job-list-filters";
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatusFilter } from "@/features/jobs/types/job";

function createCounts(): Record<JobStatusFilter, number> {
  return {
    all: 10,
    not_applied: 1,
    document_screening: 1,
    casual_interview: 1,
    first_interview: 1,
    second_interview: 1,
    final_interview: 1,
    offer: 1,
    rejected: 2,
    withdrawn: 3,
  };
}

describe("JobFilterBar", () => {
  it("すべて・未応募と進行中・終了のドロップダウンを表示する", () => {
    render(
      <JobFilterBar
        status="all"
        onStatusChange={vi.fn()}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /^すべて/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^未応募/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "進行中のステータスで絞り込む" })).toHaveTextContent(
      "進行中",
    );
    expect(screen.getByRole("combobox", { name: "終了のステータスで絞り込む" })).toHaveTextContent("終了");

    for (const group of JOB_LIST_STATUS_FILTER_GROUPS) {
      for (const status of group.statuses) {
        expect(
          screen.queryByRole("button", { name: new RegExp(`^${JOB_STATUS_LABELS[status]}`) }),
        ).not.toBeInTheDocument();
      }
    }
  });

  it("進行中グループのステータス選択時はドロップダウンがアクティブ表示になる", () => {
    render(
      <JobFilterBar
        status="first_interview"
        onStatusChange={vi.fn()}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "進行中のステータスで絞り込む" })).toHaveTextContent(
      "一次面接",
    );
  });

  it("終了グループのステータス選択時はドロップダウンがアクティブ表示になる", () => {
    render(
      <JobFilterBar
        status="withdrawn"
        onStatusChange={vi.fn()}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "終了のステータスで絞り込む" })).toHaveTextContent("辞退");
  });

  it("トップレベルと各グループで全ステータスをカバーする", () => {
    const groupedStatuses = JOB_LIST_STATUS_FILTER_GROUPS.flatMap((group) => group.statuses);
    expect([...JOB_LIST_TOP_LEVEL_STATUSES, ...groupedStatuses]).toEqual(JOB_STATUSES);
  });
});
