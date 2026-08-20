import { describe, expect, it } from "vitest";
import type { Job } from "@/features/jobs/types/job";
import {
  getInterviewDateTimeClassName,
  getJobListSurfaceClassName,
  getJobStatusSelectClassName,
  isJobListEndedStatus,
} from "./job-list-styles";

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

describe("job-list-styles", () => {
  describe("getJobListSurfaceClassName", () => {
    it("不採用・辞退のみカード全体を薄いグレーにする", () => {
      expect(getJobListSurfaceClassName("rejected")).toContain("bg-muted/40");
      expect(getJobListSurfaceClassName("withdrawn")).toContain("bg-muted/40");
    });

    it("選考中・内定は通常表示のまま", () => {
      expect(getJobListSurfaceClassName("first_interview")).toBe("");
      expect(getJobListSurfaceClassName("offer")).toBe("");
    });
  });

  describe("isJobListEndedStatus", () => {
    it("不採用と辞退のみ終了扱い", () => {
      expect(isJobListEndedStatus("rejected")).toBe(true);
      expect(isJobListEndedStatus("withdrawn")).toBe(true);
      expect(isJobListEndedStatus("first_interview")).toBe(false);
    });
  });

  describe("getJobStatusSelectClassName", () => {
    it("内定のみグリーン系スタイルを返す", () => {
      expect(getJobStatusSelectClassName(createTestJob({ status: "offer" }))).toContain(
        "bg-green-100",
      );
      expect(getJobStatusSelectClassName(createTestJob({ status: "offer" }))).toContain(
        "text-green-800",
      );
    });

    it("内定以外は白背景のまま", () => {
      expect(getJobStatusSelectClassName(createTestJob({ status: "first_interview" }))).toBe(
        "bg-white",
      );

      const waitingJob = createTestJob({
        status: "first_interview",
        first_interview_at: new Date(2026, 7, 25, 14, 0).toISOString(),
      });
      expect(getJobStatusSelectClassName(waitingJob)).toBe("bg-white");
    });
  });

  describe("getInterviewDateTimeClassName", () => {
    it("終了した面接日時は背景付きのグレー表示にする", () => {
      const now = new Date(2026, 7, 16, 15, 0);
      const interviewAt = new Date(2026, 7, 16, 10, 0).toISOString();
      const className = getInterviewDateTimeClassName(interviewAt, now);

      expect(className).toContain("bg-muted/80");
      expect(className).toContain("text-neutral-600");
      expect(className).toContain("border-neutral-300");
    });

    it("当日のこれからの面接は強調表示にする", () => {
      const now = new Date(2026, 7, 16, 15, 0);
      const interviewAt = new Date(2026, 7, 16, 18, 0).toISOString();

      expect(getInterviewDateTimeClassName(interviewAt, now)).toContain("text-destructive");
    });
  });
});
