import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import JobDetailPage from "./JobDetailPage";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useDeleteJob } from "@/features/jobs/hooks/use-delete-job";
import { useJob } from "@/features/jobs/hooks/use-job";
import { JOB_STATUS_LABELS, type Job } from "@/features/jobs/types/job";
import { formatDateTime } from "@/lib/format";

vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/jobs/hooks/use-job", () => ({
  useJob: vi.fn(),
}));

vi.mock("@/features/jobs/hooks/use-delete-job", () => ({
  useDeleteJob: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseJob = vi.mocked(useJob);
const mockedUseDeleteJob = vi.mocked(useDeleteJob);

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

function renderJobDetail(job: Job) {
  mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
  mockedUseJob.mockReturnValue({
    data: job,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useJob>);
  mockedUseDeleteJob.mockReturnValue({
    isPending: false,
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof useDeleteJob>);

  return render(
    <MemoryRouter initialEntries={[`/jobs/${job.id}`]}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function getInterviewItem(label: string) {
  const heading = screen.getByText(label);
  const container = heading.parentElement;
  if (!container) {
    throw new Error(`${label} のコンテナが見つかりません`);
  }
  return within(container);
}

describe("JobDetailPage - 面接日時とURL", () => {
  it("見出しはJOB_STATUS_LABELS（一次面接等）を使う", () => {
    renderJobDetail(createTestJob());

    expect(screen.getByText(JOB_STATUS_LABELS.first_interview)).toBeInTheDocument();
    expect(screen.getByText(JOB_STATUS_LABELS.second_interview)).toBeInTheDocument();
    expect(screen.getByText(JOB_STATUS_LABELS.final_interview)).toBeInTheDocument();
    expect(screen.queryByText("一次面接日時")).not.toBeInTheDocument();
  });

  it("日時もURLもない場合は未設定と表示する", () => {
    renderJobDetail(createTestJob());

    expect(getInterviewItem(JOB_STATUS_LABELS.first_interview).getByText("未設定")).toBeInTheDocument();
    expect(getInterviewItem(JOB_STATUS_LABELS.first_interview).queryByRole("link")).not.toBeInTheDocument();
  });

  it("日時のみの場合は日時を表示しリンクは出さない", () => {
    const at = "2026-08-07T09:00:00.000Z";
    renderJobDetail(createTestJob({ first_interview_at: at }));

    const item = getInterviewItem(JOB_STATUS_LABELS.first_interview);
    expect(item.getByText(formatDateTime(at))).toBeInTheDocument();
    expect(item.queryByRole("link")).not.toBeInTheDocument();
    expect(item.queryByText("未設定")).not.toBeInTheDocument();
  });

  it("URLのみの場合はリンクのみ表示する", () => {
    const url = "https://zoom.us/j/123";
    renderJobDetail(createTestJob({ first_interview_url: url }));

    const item = getInterviewItem(JOB_STATUS_LABELS.first_interview);
    const link = item.getByRole("link", { name: url });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(item.queryByText("未設定")).not.toBeInTheDocument();
  });

  it("日時とURLの両方がある場合は日時とリンクを表示する", () => {
    const at = "2026-08-07T09:00:00.000Z";
    const url = "https://zoom.us/j/123";
    renderJobDetail(createTestJob({ first_interview_at: at, first_interview_url: url }));

    const item = getInterviewItem(JOB_STATUS_LABELS.first_interview);
    expect(item.getByText(formatDateTime(at))).toBeInTheDocument();
    expect(item.getByRole("link", { name: url })).toHaveAttribute("href", url);
    expect(item.queryByText("未設定")).not.toBeInTheDocument();
  });
});
