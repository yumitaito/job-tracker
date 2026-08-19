import { describe, expect, it } from "vitest";
import {
  getAvailableInterviewScheduleKinds,
  getJobInterviewSchedules,
  syncLegacyInterviewFields,
} from "./interview-schedules";
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
    first_interview_at: "2026-08-10T10:00:00.000Z",
    second_interview_at: null,
    final_interview_at: null,
    casual_interview_url: null,
    first_interview_url: "https://zoom.us/j/1",
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

describe("interview-schedules", () => {
  it("旧カラムから選考スケジュールを生成する", () => {
    const schedules = getJobInterviewSchedules(createTestJob());
    expect(schedules).toHaveLength(1);
    expect(schedules[0]?.kind).toBe("first_interview");
    expect(schedules[0]?.url).toBe("https://zoom.us/j/1");
  });

  it("interview_schedules JSON を優先する", () => {
    const schedules = getJobInterviewSchedules(
      createTestJob({
        interview_schedules: [
          {
            id: "schedule-1",
            kind: "third_interview",
            scheduled_at: "2026-08-20T10:00:00.000Z",
            url: null,
          },
        ],
      }),
    );

    expect(schedules).toHaveLength(1);
    expect(schedules[0]?.kind).toBe("third_interview");
  });

  it("syncLegacyInterviewFields は旧4段階のみ同期する", () => {
    const legacy = syncLegacyInterviewFields([
      {
        id: "1",
        kind: "first_interview",
        scheduled_at: "2026-08-10T10:00:00.000Z",
        url: "https://zoom.us/j/1",
      },
      {
        id: "2",
        kind: "third_interview",
        scheduled_at: "2026-08-20T10:00:00.000Z",
        url: null,
      },
    ]);

    expect(legacy.first_interview_at).toBe("2026-08-10T10:00:00.000Z");
    expect(legacy.first_interview_url).toBe("https://zoom.us/j/1");
    expect(legacy.second_interview_at).toBeNull();
  });

  it("getAvailableInterviewScheduleKinds は未追加の種別だけ返す", () => {
    const available = getAvailableInterviewScheduleKinds([
      { id: "1", kind: "first_interview" },
      { id: "2", kind: "other", custom_label: "技術面接" },
    ]);

    expect(available).toContain("second_interview");
    expect(available).toContain("other");
    expect(available).not.toContain("first_interview");
  });
});
