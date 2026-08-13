import { describe, expect, it } from "vitest";
import type { Job } from "@/features/jobs/types/job";
import {
  getInterviewReminderKey,
  getJobInterviews,
  getLatestInterview,
  getMinutesUntilInterview,
  INTERVIEW_STAGE_LABELS,
  isFiveMinutesBeforeInterview,
} from "./interview";

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
    status: "not_applied",
    first_interview_at: null,
    second_interview_at: null,
    final_interview_at: null,
    location: null,
    technologies: null,
    notes: null,
    min_salary: null,
    max_salary: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getLatestInterview", () => {
  it("final_interview_atのみ入力されている場合、final_interviewを返す", () => {
    const job = createTestJob({ final_interview_at: "2026-03-01T10:00:00.000Z" });
    expect(getLatestInterview(job)).toEqual({
      stage: "final_interview",
      at: "2026-03-01T10:00:00.000Z",
    });
  });

  it("first_interview_atのみ入力されている場合、first_interviewを返す", () => {
    const job = createTestJob({ first_interview_at: "2026-01-10T10:00:00.000Z" });
    expect(getLatestInterview(job)).toEqual({
      stage: "first_interview",
      at: "2026-01-10T10:00:00.000Z",
    });
  });

  it("second_interview_atのみ入力されている場合、second_interviewを返す", () => {
    const job = createTestJob({ second_interview_at: "2026-01-20T14:00:00.000Z" });
    expect(getLatestInterview(job)).toEqual({
      stage: "second_interview",
      at: "2026-01-20T14:00:00.000Z",
    });
  });

  it("first_interview_atとsecond_interview_atが両方入力されている場合（finalは未入力）、second_interviewを優先して返す", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
    });
    expect(getLatestInterview(job)).toEqual({
      stage: "second_interview",
      at: "2026-01-20T14:00:00.000Z",
    });
  });

  it("3つとも入力されている場合、final_interviewを最優先で返す", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
      final_interview_at: "2026-02-01T16:30:00.000Z",
    });
    expect(getLatestInterview(job)).toEqual({
      stage: "final_interview",
      at: "2026-02-01T16:30:00.000Z",
    });
  });

  it("3つとも未入力（null）の場合、nullを返す", () => {
    const job = createTestJob();
    expect(getLatestInterview(job)).toBeNull();
  });
});

describe("INTERVIEW_STAGE_LABELS", () => {
  it("first_interview/second_interview/final_interviewの3キーすべてに文字列が定義されている", () => {
    expect(INTERVIEW_STAGE_LABELS.first_interview).toBe("一次面接日時");
    expect(INTERVIEW_STAGE_LABELS.second_interview).toBe("二次面接日時");
    expect(INTERVIEW_STAGE_LABELS.final_interview).toBe("最終面接日時");
  });
});

describe("getJobInterviews", () => {
  it("入力されている面接日時をすべて返す", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
    });

    expect(getJobInterviews(job)).toEqual([
      { stage: "first_interview", at: "2026-01-10T10:00:00.000Z" },
      { stage: "second_interview", at: "2026-01-20T14:00:00.000Z" },
    ]);
  });
});

describe("isFiveMinutesBeforeInterview", () => {
  it("面接開始5分前のときtrueを返す", () => {
    const interviewAt = new Date("2026-08-20T14:00:00");
    const now = new Date(interviewAt.getTime() - 5 * 60_000);

    expect(isFiveMinutesBeforeInterview(interviewAt.toISOString(), now)).toBe(true);
  });

  it("面接開始4分前のときfalseを返す", () => {
    const interviewAt = new Date("2026-08-20T14:00:00");
    const now = new Date(interviewAt.getTime() - 4 * 60_000);

    expect(isFiveMinutesBeforeInterview(interviewAt.toISOString(), now)).toBe(false);
  });

  it("面接開始6分前のときfalseを返す", () => {
    const interviewAt = new Date("2026-08-20T14:00:00");
    const now = new Date(interviewAt.getTime() - 6 * 60_000);

    expect(isFiveMinutesBeforeInterview(interviewAt.toISOString(), now)).toBe(false);
  });
});

describe("getInterviewReminderKey", () => {
  it("求人ID・面接段階・日時から一意キーを生成する", () => {
    expect(getInterviewReminderKey("job-1", "first_interview", "2026-08-20T05:00:00.000Z")).toBe(
      "job-1:first_interview:2026-08-20T05:00:00.000Z",
    );
  });
});

describe("getMinutesUntilInterview", () => {
  it("未来の面接までの残り分数を返す", () => {
    const interviewAt = new Date("2026-08-20T14:00:00");
    const now = new Date(interviewAt.getTime() - 5 * 60_000);

    expect(getMinutesUntilInterview(interviewAt.toISOString(), now)).toBe(5);
  });
});
