import { describe, expect, it } from "vitest";
import { getDefaultJobFormValues, jobToFormValues } from "./job-mappers";
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

describe("jobToFormValues - 選考スケジュール", () => {
  it("旧カラムから選考スケジュールを生成する", () => {
    const values = jobToFormValues(
      createTestJob({
        first_interview_url: "https://zoom.us/j/1",
      }),
    );

    expect(values.interview_schedules).toHaveLength(1);
    expect(values.interview_schedules?.[0]?.kind).toBe("first_interview");
    expect(values.interview_schedules?.[0]?.url).toBe("https://zoom.us/j/1");
  });

  it("interview_schedules がある場合はそれを優先する", () => {
    const values = jobToFormValues(
      createTestJob({
        interview_schedules: [
          {
            id: "schedule-1",
            kind: "third_interview",
            scheduled_at: "2026-08-07T09:00:00.000Z",
            url: null,
          },
        ],
      }),
    );

    expect(values.interview_schedules).toHaveLength(1);
    expect(values.interview_schedules?.[0]?.kind).toBe("third_interview");
  });
});

describe("getDefaultJobFormValues", () => {
  it("新規登録用の初期値に今日の応募日を設定する", () => {
    const values = getDefaultJobFormValues();
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    expect(values.application_date).toBe(expected);
    expect(values.status).toBe("document_screening");
    expect(values.interview_schedules).toEqual([]);
  });
});
