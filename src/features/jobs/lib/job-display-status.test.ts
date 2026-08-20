import { describe, expect, it } from "vitest";
import type { Job } from "@/features/jobs/types/job";
import { getJobListDisplayStatus } from "./job-display-status";

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

describe("getJobListDisplayStatus", () => {
  const now = new Date(2026, 7, 25, 15, 0);

  it("一次面接・面接日時が未来の場合は一次面接を表示する", () => {
    const job = createTestJob({
      status: "first_interview",
      first_interview_at: new Date(2026, 7, 25, 16, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "一次面接",
      status: "first_interview",
      isWaitingForResult: false,
    });
  });

  it("一次面接・面接日時が過去の場合は一次面接・結果待ちを表示する", () => {
    const job = createTestJob({
      status: "first_interview",
      first_interview_at: new Date(2026, 7, 25, 14, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "一次面接・結果待ち",
      status: "first_interview",
      isWaitingForResult: true,
    });
  });

  it("二次面接では一次面接の過去日時を結果待ち判定に使わない", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: new Date(2026, 7, 20, 14, 0).toISOString(),
      second_interview_at: new Date(2026, 7, 29, 15, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "二次面接",
      status: "second_interview",
      isWaitingForResult: false,
    });
  });

  it("二次面接・面接日時が過去の場合は二次面接・結果待ちを表示する", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: new Date(2026, 7, 20, 14, 0).toISOString(),
      second_interview_at: new Date(2026, 7, 25, 14, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "二次面接・結果待ち",
      status: "second_interview",
      isWaitingForResult: true,
    });
  });

  it("二次面接・面接日時未登録の場合は結果待ちにしない", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: new Date(2026, 7, 20, 14, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "二次面接",
      status: "second_interview",
      isWaitingForResult: false,
    });
  });

  it("最終面接・面接日時が過去の場合は最終面接・結果待ちを表示する", () => {
    const job = createTestJob({
      status: "final_interview",
      final_interview_at: new Date(2026, 7, 25, 13, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "最終面接・結果待ち",
      status: "final_interview",
      isWaitingForResult: true,
    });
  });

  it("内定は面接日時が過去でも結果待ちにしない", () => {
    const job = createTestJob({
      status: "offer",
      final_interview_at: new Date(2026, 7, 20, 14, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "内定",
      status: "offer",
      isWaitingForResult: false,
    });
  });

  it.each(["rejected", "withdrawn"] as const)("%s は結果待ちにしない", (status) => {
    const job = createTestJob({
      status,
      first_interview_at: new Date(2026, 7, 20, 14, 0).toISOString(),
    });

    expect(getJobListDisplayStatus(job, now).isWaitingForResult).toBe(false);
  });

  it("書類選考中は結果待ちにしない", () => {
    const job = createTestJob({ status: "document_screening" });

    expect(getJobListDisplayStatus(job, now)).toEqual({
      label: "書類選考中",
      status: "document_screening",
      isWaitingForResult: false,
    });
  });
});
