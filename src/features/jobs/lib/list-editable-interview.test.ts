import { describe, expect, it } from "vitest";
import type { Job } from "@/features/jobs/types/job";
import { INTERVIEW_SCHEDULE_KIND_LABELS } from "@/features/jobs/types/interview-schedule";
import {
  buildListInterviewDateUpdateInput,
  getListEditableInterview,
  shouldHideListInterviewDateTime,
} from "./list-editable-interview";

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

describe("getListEditableInterview", () => {
  it("選考ステータスが一次面接の場合、一次面接の日時を返す", () => {
    const job = createTestJob({
      status: "first_interview",
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "first_interview",
      field: "first_interview_at",
      at: "2026-01-10T10:00:00.000Z",
    });
  });

  it("選考ステータスが二次面接の場合、二次面接の日時を返す（一次面接の日時は使わない）", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "second_interview",
      field: "second_interview_at",
      at: "2026-01-20T14:00:00.000Z",
    });
  });

  it("選考ステータスが二次面接で日時未登録の場合、nullを返す", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: "2026-01-10T10:00:00.000Z",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "second_interview",
      field: "second_interview_at",
      at: null,
      url: null,
    });
  });

  it("面接日時未入力で選考ステータスが面接中の場合、その段階を編集対象にする", () => {
    const job = createTestJob({ status: "first_interview" });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "first_interview",
      field: "first_interview_at",
      at: null,
      url: null,
      label: INTERVIEW_SCHEDULE_KIND_LABELS.first_interview,
      scheduleId: "",
    });
  });

  it("面接以外の選考ステータスでは面接日時を空にする", () => {
    const job = createTestJob({
      status: "document_screening",
      first_interview_at: "2026-01-10T10:00:00.000Z",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      at: null,
      url: null,
    });
    expect(getListEditableInterview(job).field).toBeUndefined();
  });

  it("二次面接ステータスで二次面接URLがある場合、そのURLを返す", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: "2026-01-10T10:00:00.000Z",
      second_interview_at: "2026-01-20T14:00:00.000Z",
      second_interview_url: "https://zoom.us/j/second",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "second_interview",
      at: "2026-01-20T14:00:00.000Z",
      url: "https://zoom.us/j/second",
    });
  });

  it("二次面接ステータスで一次面接にだけURLがある場合、urlはnullになる", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: "2026-01-10T10:00:00.000Z",
      first_interview_url: "https://zoom.us/j/first",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "second_interview",
      at: null,
      url: null,
    });
  });

  it("日時なし・statusがfirst_interviewで一次面接URLがある場合、そのURLを返す", () => {
    const job = createTestJob({
      status: "first_interview",
      first_interview_url: "https://zoom.us/j/first",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "first_interview",
      field: "first_interview_at",
      at: null,
      url: "https://zoom.us/j/first",
    });
  });

  it("最終面接ステータスでは最終面接の日時とURLを返す", () => {
    const job = createTestJob({
      status: "final_interview",
      first_interview_at: "2026-01-10T10:00:00.000Z",
      final_interview_at: "2026-02-01T16:30:00.000Z",
      final_interview_url: "https://zoom.us/j/final",
    });

    expect(getListEditableInterview(job)).toMatchObject({
      stage: "final_interview",
      field: "final_interview_at",
      at: "2026-02-01T16:30:00.000Z",
      url: "https://zoom.us/j/final",
    });
  });
});

describe("buildListInterviewDateUpdateInput", () => {
  it("スケジュール未作成の段階に日時を保存すると interview_schedules に追加する", () => {
    const job = createTestJob({
      status: "second_interview",
      first_interview_at: "2026-01-10T10:00:00.000Z",
    });
    const editable = getListEditableInterview(job);
    const nextAt = "2026-01-20T14:00:00.000Z";

    const input = buildListInterviewDateUpdateInput(job, editable, nextAt);

    expect(input.second_interview_at).toBe(nextAt);
    expect(input.first_interview_at).toBe("2026-01-10T10:00:00.000Z");
    expect(input.interview_schedules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "first_interview", scheduled_at: "2026-01-10T10:00:00.000Z" }),
        expect.objectContaining({ kind: "second_interview", scheduled_at: nextAt }),
      ]),
    );
  });
});

describe("shouldHideListInterviewDateTime", () => {
  it("内定の場合は一覧の面接日時を非表示にする", () => {
    expect(
      shouldHideListInterviewDateTime(
        createTestJob({
          status: "offer",
          final_interview_at: "2026-02-01T16:30:00.000Z",
        }),
      ),
    ).toBe(true);
  });

  it("内定以外は面接日時を表示する", () => {
    expect(shouldHideListInterviewDateTime(createTestJob({ status: "final_interview" }))).toBe(false);
  });
});
