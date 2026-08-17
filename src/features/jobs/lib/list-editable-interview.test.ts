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
    casual_interview_at: null,
    first_interview_at: null,
    second_interview_at: null,
    final_interview_at: null,
    casual_interview_url: null,
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
      url: null,
    });
  });

  it("面接日時未入力で選考ステータスが面接中の場合、その段階を編集対象にする", () => {
    const job = createTestJob({ status: "first_interview" });

    expect(getListEditableInterview(job)).toEqual({
      stage: "first_interview",
      field: "first_interview_at",
      at: null,
      url: null,
    });
  });

  it("面接日時未入力で選考ステータスが面接以外の場合、一次面接日時を編集対象にする", () => {
    const job = createTestJob({ status: "document_screening" });

    expect(getListEditableInterview(job)).toEqual({
      stage: "first_interview",
      field: "first_interview_at",
      at: null,
      url: null,
    });
  });

  it("二次面接日時が最新で二次面接URLがある場合、そのURLを返す", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
      second_interview_url: "https://zoom.us/j/second",
    });

    expect(getListEditableInterview(job)).toEqual({
      stage: "second_interview",
      field: "second_interview_at",
      at: "2026-01-20T14:00:00.000Z",
      url: "https://zoom.us/j/second",
    });
  });

  it("二次面接日時が最新で一次面接にだけURLがある場合、urlはnullになる", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
      first_interview_url: "https://zoom.us/j/first",
    });

    expect(getListEditableInterview(job)).toEqual({
      stage: "second_interview",
      field: "second_interview_at",
      at: "2026-01-20T14:00:00.000Z",
      url: null,
    });
  });

  it("日時なし・statusがfirst_interviewで一次面接URLがある場合、そのURLを返す", () => {
    const job = createTestJob({
      status: "first_interview",
      first_interview_url: "https://zoom.us/j/first",
    });

    expect(getListEditableInterview(job)).toEqual({
      stage: "first_interview",
      field: "first_interview_at",
      at: null,
      url: "https://zoom.us/j/first",
    });
  });

  it("最終面接日時が最新で最終面接URLがある場合、そのURLを返す", () => {
    const job = createTestJob({
      first_interview_at: "2026-01-10T10:00:00.000Z",
      final_interview_at: "2026-02-01T16:30:00.000Z",
      first_interview_url: "https://zoom.us/j/first",
      final_interview_url: "https://zoom.us/j/final",
    });

    expect(getListEditableInterview(job)).toEqual({
      stage: "final_interview",
      field: "final_interview_at",
      at: "2026-02-01T16:30:00.000Z",
      url: "https://zoom.us/j/final",
    });
  });
});
