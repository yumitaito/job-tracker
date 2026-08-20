import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobListStatusField } from "./JobListInlineFields";
import type { Job } from "@/features/jobs/types/job";

function createTestJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    user_id: "user-1",
    company_name: "テスト株式会社",
    position: "エンジニア",
    employment_type: null,
    application_url: null,
    application_date: null,
    status: "first_interview",
    desire_level: "medium",
    casual_interview_at: null,
    first_interview_at: null,
    second_interview_at: null,
    final_interview_at: null,
    casual_interview_url: null,
    first_interview_url: null,
    second_interview_url: null,
    final_interview_url: null,
    interview_schedules: null,
    location: null,
    technologies: null,
    notes: null,
    min_salary: null,
    max_salary: null,
    display_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("JobListStatusField", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 25, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("面接日時が過去の場合は結果待ちラベルを表示する", () => {
    render(
      <JobListStatusField
        job={createTestJob({
          status: "first_interview",
          first_interview_at: new Date(2026, 7, 25, 14, 0).toISOString(),
        })}
        onUpdate={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("一次面接・結果待ち");
  });

  it("Dropdown を開いても DB ステータスの選択肢のみ表示する", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(
      <JobListStatusField
        job={createTestJob({
          status: "first_interview",
          first_interview_at: new Date(2026, 7, 25, 14, 0).toISOString(),
        })}
        onUpdate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("option", { name: "一次面接" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /結果待ち/ })).not.toBeInTheDocument();
  });

  it("ステータス変更時は DB ステータス値をそのまま保存する", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(
      <JobListStatusField
        job={createTestJob({
          status: "first_interview",
          first_interview_at: new Date(2026, 7, 25, 14, 0).toISOString(),
        })}
        onUpdate={onUpdate}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "二次面接" }));

    expect(onUpdate).toHaveBeenCalledWith("job-1", { status: "second_interview" });
  });
});
