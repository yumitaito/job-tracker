import { describe, expect, it } from "vitest";
import type { Job } from "@/features/jobs/types/job";
import {
  getInterviewProximitySortKey,
  getInterviewReminderKey,
  getJobInterviews,
  getLatestInterview,
  getMinutesUntilInterview,
  INTERVIEW_STAGE_LABELS,
  isFiveMinutesBeforeInterview,
  sortJobsByUpcomingInterview,
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
    display_order: 0,
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

describe("sortJobsByUpcomingInterview", () => {
  const now = new Date("2026-08-16T10:00:00.000Z");

  it("未来の面接が近い順に並ぶ", () => {
    const jobs = [
      createTestJob({
        id: "job-far",
        company_name: "B社",
        first_interview_at: "2026-08-20T10:00:00.000Z",
      }),
      createTestJob({
        id: "job-soon",
        company_name: "A社",
        first_interview_at: "2026-08-17T10:00:00.000Z",
      }),
    ];

    expect(sortJobsByUpcomingInterview(jobs, now).map((job) => job.id)).toEqual([
      "job-soon",
      "job-far",
    ]);
  });

  it("複数段階の面接がある場合は最も近い未来の面接日時で並ぶ", () => {
    const jobs = [
      createTestJob({
        id: "job-later-stage",
        company_name: "B社",
        first_interview_at: "2026-08-10T10:00:00.000Z",
        second_interview_at: "2026-08-25T10:00:00.000Z",
      }),
      createTestJob({
        id: "job-sooner-first",
        company_name: "A社",
        first_interview_at: "2026-08-18T10:00:00.000Z",
      }),
    ];

    expect(sortJobsByUpcomingInterview(jobs, now).map((job) => job.id)).toEqual([
      "job-sooner-first",
      "job-later-stage",
    ]);
  });

  it("過去の面接も現在時刻に近い順で並ぶ", () => {
    const jobs = [
      createTestJob({
        id: "job-none",
        company_name: "C社",
      }),
      createTestJob({
        id: "job-far-future",
        company_name: "D社",
        first_interview_at: "2026-08-25T10:00:00.000Z",
      }),
      createTestJob({
        id: "job-recent-past",
        company_name: "B社",
        first_interview_at: "2026-08-15T10:00:00.000Z",
      }),
      createTestJob({
        id: "job-upcoming",
        company_name: "A社",
        first_interview_at: "2026-08-17T10:00:00.000Z",
      }),
      createTestJob({
        id: "job-old-past",
        company_name: "E社",
        first_interview_at: "2026-08-10T10:00:00.000Z",
      }),
    ];

    expect(sortJobsByUpcomingInterview(jobs, now).map((job) => job.id)).toEqual([
      "job-upcoming",
      "job-recent-past",
      "job-old-past",
      "job-far-future",
      "job-none",
    ]);
  });

  it("同じ並び順の場合は企業名で並ぶ", () => {
    const jobs = [
      createTestJob({
        id: "job-b",
        company_name: "B社",
        first_interview_at: "2026-08-17T10:00:00.000Z",
      }),
      createTestJob({
        id: "job-a",
        company_name: "A社",
        first_interview_at: "2026-08-17T10:00:00.000Z",
      }),
    ];

    expect(sortJobsByUpcomingInterview(jobs, now).map((job) => job.id)).toEqual([
      "job-a",
      "job-b",
    ]);
  });
});

describe("getInterviewProximitySortKey", () => {
  const now = new Date("2026-08-16T10:00:00.000Z");

  it("面接日時がある求人は現在時刻からの距離を返す", () => {
    const job = createTestJob({ first_interview_at: "2026-08-17T10:00:00.000Z" });
    expect(getInterviewProximitySortKey(job, now)).toEqual({
      hasInterview: true,
      distance: 24 * 60 * 60 * 1000,
      timestamp: new Date("2026-08-17T10:00:00.000Z").getTime(),
    });
  });

  it("過去の面接日時も距離ベースで評価する", () => {
    const job = createTestJob({ first_interview_at: "2026-08-15T10:00:00.000Z" });
    expect(getInterviewProximitySortKey(job, now)).toEqual({
      hasInterview: true,
      distance: 24 * 60 * 60 * 1000,
      timestamp: new Date("2026-08-15T10:00:00.000Z").getTime(),
    });
  });
});
