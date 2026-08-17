import { describe, expect, it } from "vitest";
import { jobToFormValues } from "./job-mappers";
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

describe("jobToFormValues - 面接URL", () => {
  it("面接URLがnullなら空文字に変換する", () => {
    const values = jobToFormValues(createTestJob());

    expect(values.first_interview_url).toBe("");
    expect(values.second_interview_url).toBe("");
    expect(values.final_interview_url).toBe("");
  });

  it("面接URLがあればそのままフォーム値に載せる", () => {
    const values = jobToFormValues(
      createTestJob({
        first_interview_url: "https://zoom.us/j/1",
        second_interview_url: "https://zoom.us/j/2",
        final_interview_url: "https://zoom.us/j/3",
      }),
    );

    expect(values.first_interview_url).toBe("https://zoom.us/j/1");
    expect(values.second_interview_url).toBe("https://zoom.us/j/2");
    expect(values.final_interview_url).toBe("https://zoom.us/j/3");
  });
});
