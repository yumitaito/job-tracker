import { describe, expect, it } from "vitest";
import type { Job } from "@/features/jobs/types/job";
import { getListEditableInterview } from "./list-editable-interview";

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

describe("getListEditableInterview", () => {
  it("最も進んだ面接日時を編集対象にする", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
    });

    expect(getListEditableInterview(job)).toEqual({
      stage: "second_interview",
      field: "second_interview_at",
      at: "2026-01-20T14:00:00.000Z",
    });
  });

  it("面接日時未入力で選考ステータスが面接中の場合、その段階を編集対象にする", () => {
    const job = createTestJob({ status: "first_interview" });

    expect(getListEditableInterview(job)).toEqual({
      stage: "first_interview",
      field: "first_interview_at",
      at: null,
    });
  });

  it("面接日時未入力で選考ステータスが面接以外の場合、一次面接日時を編集対象にする", () => {
    const job = createTestJob({ status: "document_screening" });

    expect(getListEditableInterview(job)).toEqual({
      stage: "first_interview",
      field: "first_interview_at",
      at: null,
    });
  });
});
