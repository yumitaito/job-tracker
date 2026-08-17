import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InterviewReminder } from "./InterviewReminder";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useJobs } from "@/features/jobs/hooks/use-jobs";
import { getInterviewReminderKey } from "@/features/jobs/lib/interview";
import type { AuthUser } from "@/features/auth/types/auth";
import type { Job } from "@/features/jobs/types/job";

vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/jobs/hooks/use-jobs", () => ({
  useJobs: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseJobs = vi.mocked(useJobs);

const NOTIFIED_STORAGE_KEY = "job-tracker-interview-reminders";

const testUser: AuthUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: null,
  createdAt: null,
};

/** テスト用の`Job`オブジェクトを生成するファクトリ関数。必要なフィールドのみoverridesで上書きする。 */
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

function mockJobs(jobs: Job[] | undefined) {
  mockedUseJobs.mockReturnValue({ data: jobs } as unknown as ReturnType<typeof useJobs>);
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("InterviewReminder", () => {
  it("未ログインの場合は何も表示しない", () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockJobs(undefined);

    const { container } = render(<InterviewReminder />);

    expect(container).toBeEmptyDOMElement();
  });

  it("ログイン済みでも面接が5分前でなければ何も表示しない", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 30 * 60_000)); // 30分前
    mockJobs([createTestJob({ first_interview_at: interviewAt.toISOString() })]);

    const { container } = render(<InterviewReminder />);

    expect(container).toBeEmptyDOMElement();
  });

  it("面接開始5分前になると企業名・面接段階・日時を含むアラートを表示する", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([
      createTestJob({ company_name: "株式会社サンプル", first_interview_at: interviewAt.toISOString() }),
    ]);

    render(<InterviewReminder />);

    expect(screen.getByText("面接5分前です")).toBeInTheDocument();
    expect(screen.getByText(/株式会社サンプル/)).toBeInTheDocument();
    expect(screen.getByText(/一次面接日時/)).toBeInTheDocument();
  });

  it("面接入室URLがある場合は入室するリンクを表示する", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([
      createTestJob({
        company_name: "株式会社サンプル",
        first_interview_at: interviewAt.toISOString(),
        first_interview_url: "https://zoom.us/j/123",
      }),
    ]);

    render(<InterviewReminder />);

    const link = screen.getByRole("link", { name: "株式会社サンプルの一次面接日時に入室" });
    expect(link).toHaveTextContent("入室する");
    expect(link).toHaveAttribute("href", "https://zoom.us/j/123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("面接入室URLがない場合は入室リンクを表示しない", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([
      createTestJob({ company_name: "株式会社サンプル", first_interview_at: interviewAt.toISOString() }),
    ]);

    render(<InterviewReminder />);

    expect(screen.getByText("面接5分前です")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("入室する")).not.toBeInTheDocument();
  });

  it("5分前の段階と異なる面接URLでは入室リンクを表示しない", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([
      createTestJob({
        company_name: "株式会社サンプル",
        first_interview_at: interviewAt.toISOString(),
        second_interview_url: "https://zoom.us/j/second",
      }),
    ]);

    render(<InterviewReminder />);

    expect(screen.getByText("面接5分前です")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("二次面接が5分前で二次面接URLがある場合は二次面接の入室リンクを表示する", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([
      createTestJob({
        company_name: "B社",
        second_interview_at: interviewAt.toISOString(),
        second_interview_url: "https://zoom.us/j/2",
      }),
    ]);

    render(<InterviewReminder />);

    const link = screen.getByRole("link", { name: "B社の二次面接日時に入室" });
    expect(link).toHaveTextContent("入室する");
    expect(link).toHaveAttribute("href", "https://zoom.us/j/2");
  });

  it("複数の求人・面接段階が同時に5分前を迎えた場合はそれぞれアラートを表示する", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([
      createTestJob({ id: "job-1", company_name: "A社", first_interview_at: interviewAt.toISOString() }),
      createTestJob({ id: "job-2", company_name: "B社", second_interview_at: interviewAt.toISOString() }),
    ]);

    render(<InterviewReminder />);

    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(screen.getByText(/A社/)).toBeInTheDocument();
    expect(screen.getByText(/B社/)).toBeInTheDocument();
  });

  it("通知を閉じるボタンでそのアラートのみ非表示にできる", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([
      createTestJob({ id: "job-1", company_name: "A社", first_interview_at: interviewAt.toISOString() }),
      createTestJob({ id: "job-2", company_name: "B社", second_interview_at: interviewAt.toISOString() }),
    ]);

    render(<InterviewReminder />);

    expect(screen.getAllByRole("alert")).toHaveLength(2);

    const aAlert = screen.getByText(/A社/).closest('[role="alert"]') as HTMLElement;
    fireEvent.click(within(aAlert).getByRole("button", { name: "通知を閉じる" }));

    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.queryByText(/A社/)).not.toBeInTheDocument();
    expect(screen.getByText(/B社/)).toBeInTheDocument();
  });

  it("同一面接に対しては30秒ごとのポーリングで再チェックされても重複してアラートを追加しない", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000)); // ちょうど5分前（当たり判定内）
    mockJobs([createTestJob({ company_name: "A社", first_interview_at: interviewAt.toISOString() })]);

    render(<InterviewReminder />);
    expect(screen.getAllByRole("alert")).toHaveLength(1);

    // 30秒経過（4.5分前になり、まだ当たり判定内）してもアラートは増えない
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("閉じた後もセッション内では再通知されない（sessionStorageで既読を保持する）", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([createTestJob({ id: "job-1", company_name: "A社", first_interview_at: interviewAt.toISOString() })]);

    render(<InterviewReminder />);
    expect(screen.getAllByRole("alert")).toHaveLength(1);

    const key = getInterviewReminderKey("job-1", "first_interview", interviewAt.toISOString());
    const stored = JSON.parse(sessionStorage.getItem(NOTIFIED_STORAGE_KEY) ?? "[]");
    expect(stored).toContain(key);
  });

  it("sessionStorageに既読キーが保存済みの面接は、当たり判定内でも再表示しない", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    const interviewAt = new Date("2026-08-20T14:00:00");
    const key = getInterviewReminderKey("job-1", "first_interview", interviewAt.toISOString());
    sessionStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify([key]));
    vi.setSystemTime(new Date(interviewAt.getTime() - 5 * 60_000));
    mockJobs([createTestJob({ id: "job-1", company_name: "A社", first_interview_at: interviewAt.toISOString() })]);

    const { container } = render(<InterviewReminder />);

    expect(container).toBeEmptyDOMElement();
  });

  it("求人一覧の取得がまだ完了していない（undefined）場合は何も表示しない", () => {
    mockedUseAuth.mockReturnValue({ user: testUser, isLoading: false });
    mockJobs(undefined);

    const { container } = render(<InterviewReminder />);

    expect(container).toBeEmptyDOMElement();
  });

  it("ログイン状態に応じてuseJobsのenabledフラグを切り替える", () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockJobs(undefined);

    render(<InterviewReminder />);

    expect(mockedUseJobs).toHaveBeenCalledWith("application_date_desc", false);
  });
});
