import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobFilterBar } from "./JobFilterBar";
import {
  JOB_LIST_ENDED_FILTER,
  JOB_LIST_IN_PROGRESS_FILTER,
  JOB_LIST_STATUS_FILTER_GROUPS,
  JOB_LIST_TOP_LEVEL_STATUSES,
} from "@/features/jobs/lib/job-list-filters";
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatusFilter } from "@/features/jobs/types/job";

function createCounts(): Record<JobStatusFilter, number> {
  return {
    all: 10,
    in_progress: 5,
    ended: 6,
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
  it("すべて・未応募と進行中・終了の分割ピルを表示する", () => {
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
    expect(screen.getByRole("button", { name: "進行中で絞り込む" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "終了で絞り込む" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "進行中のステータスを選択" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "終了のステータスを選択" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^書類選考中/ })).not.toBeInTheDocument();

    for (const group of JOB_LIST_STATUS_FILTER_GROUPS) {
      for (const status of group.statuses) {
        expect(
          screen.queryByRole("button", { name: new RegExp(`^${JOB_STATUS_LABELS[status]}`) }),
        ).not.toBeInTheDocument();
      }
    }
  });

  it("進行中ピルクリックで in_progress フィルターを適用する", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(
      <JobFilterBar
        status="all"
        onStatusChange={onStatusChange}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "進行中で絞り込む" }));

    expect(onStatusChange).toHaveBeenCalledWith(JOB_LIST_IN_PROGRESS_FILTER);
  });

  it("終了ピルクリックで ended フィルターを適用する", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(
      <JobFilterBar
        status="all"
        onStatusChange={onStatusChange}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "終了で絞り込む" }));

    expect(onStatusChange).toHaveBeenCalledWith(JOB_LIST_ENDED_FILTER);
  });

  it("進行中グループのステータス選択時はラベルが選択中ステータスになる", () => {
    render(
      <JobFilterBar
        status="first_interview"
        onStatusChange={vi.fn()}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "進行中で絞り込む" })).toHaveTextContent("一次面接");
  });

  it("終了グループのステータス選択時はラベルが選択中ステータスになる", () => {
    render(
      <JobFilterBar
        status="withdrawn"
        onStatusChange={vi.fn()}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "終了で絞り込む" })).toHaveTextContent("辞退");
  });

  it("in_progress 選択時は進行中ピルがアクティブ表示になる", () => {
    render(
      <JobFilterBar
        status="in_progress"
        onStatusChange={vi.fn()}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "進行中で絞り込む" }).parentElement).toHaveClass(
      "bg-secondary",
    );
  });

  it("ended 選択時は終了ピルがアクティブ表示になる", () => {
    render(
      <JobFilterBar
        status="ended"
        onStatusChange={vi.fn()}
        counts={createCounts()}
        sort="application_date_desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "終了で絞り込む" }).parentElement).toHaveClass(
      "bg-secondary",
    );
  });

  it("トップレベルと各グループで全ステータスをカバーする", () => {
    const groupedStatuses = JOB_LIST_STATUS_FILTER_GROUPS.flatMap((group) => group.statuses);
    expect([...JOB_LIST_TOP_LEVEL_STATUSES, ...groupedStatuses]).toEqual(JOB_STATUSES);
  });
});
