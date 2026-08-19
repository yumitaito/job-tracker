import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobListInterviewField } from "./JobListInlineFields";
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
    status: "not_applied",
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

describe("JobListInterviewField", () => {
  it.each([
    "not_applied",
    "document_screening",
    "offer",
    "rejected",
    "withdrawn",
  ] as const)("%s の場合は面接日時を表示しない", (status) => {
    const { container } = render(
      <JobListInterviewField
        job={createTestJob({
          status,
          first_interview_at: "2026-02-01T16:30:00.000Z",
        })}
        onUpdate={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("面接中の選考ステータスでは面接日時入力を表示する", () => {
    render(
      <JobListInterviewField
        job={createTestJob({
          status: "final_interview",
          final_interview_at: "2026-02-01T16:30:00.000Z",
        })}
        onUpdate={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: /テスト株式会社の最終面接/i });
    expect(trigger).toBeInTheDocument();
  });

  it("二次面接ステータスで日時未登録の場合は空の入力欄を表示する", () => {
    render(
      <JobListInterviewField
        job={createTestJob({
          status: "second_interview",
          first_interview_at: "2026-02-01T16:30:00.000Z",
        })}
        onUpdate={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: /テスト株式会社の二次面接/i });
    expect(trigger).toHaveTextContent("日時を選択");
  });
});
