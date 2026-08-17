import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobListInterviewField } from "./JobListInlineFields";
import { INTERVIEW_STAGE_LABELS } from "@/features/jobs/lib/interview";
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
    first_interview_at: null,
    second_interview_at: null,
    final_interview_at: null,
    first_interview_url: null,
    second_interview_url: null,
    final_interview_url: null,
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
  it("表示中の段階にURLがある場合は入室リンクを表示する", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      first_interview_url: "https://zoom.us/j/first",
    });

    render(<JobListInterviewField job={job} onUpdate={vi.fn()} />);

    const link = screen.getByRole("link", {
      name: `${job.company_name}の${INTERVIEW_STAGE_LABELS.first_interview}に入室`,
    });
    expect(link).toHaveTextContent("入室");
    expect(link).toHaveAttribute("href", "https://zoom.us/j/first");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("表示中の段階にURLがない場合は入室リンクを表示しない", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
    });

    render(<JobListInterviewField job={job} onUpdate={vi.fn()} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("入室")).not.toBeInTheDocument();
  });

  it("二次面接が表示対象のとき、一次面接URLだけでは入室リンクを出さない", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
      first_interview_url: "https://zoom.us/j/first",
    });

    render(<JobListInterviewField job={job} onUpdate={vi.fn()} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("二次面接が表示対象で二次面接URLがある場合は二次面接の入室リンクを表示する", () => {
    const job = createTestJob({
      company_name: "株式会社サンプル",
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
      second_interview_url: "https://meet.google.com/abc-defg-hij",
    });

    render(<JobListInterviewField job={job} onUpdate={vi.fn()} />);

    const link = screen.getByRole("link", {
      name: `株式会社サンプルの${INTERVIEW_STAGE_LABELS.second_interview}に入室`,
    });
    expect(link).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
  });

  it("日時未入力でも選考ステータスの段階にURLがあれば入室リンクを表示する", () => {
    const job = createTestJob({
      status: "final_interview",
      final_interview_url: "https://zoom.us/j/final",
    });

    render(<JobListInterviewField job={job} onUpdate={vi.fn()} />);

    const link = screen.getByRole("link", {
      name: `${job.company_name}の${INTERVIEW_STAGE_LABELS.final_interview}に入室`,
    });
    expect(link).toHaveAttribute("href", "https://zoom.us/j/final");
  });
});
