import { describe, expect, it } from "vitest";
import { buildInterviewPayloadFromForm, jobFormSchema } from "./job-schema";

const baseValues = {
  company_name: "テスト株式会社",
  position: "エンジニア",
  employment_type: undefined,
  application_url: undefined,
  application_date: undefined,
  status: "not_applied" as const,
  desire_level: "medium" as const,
  interview_schedules: [],
  location: undefined,
  technologies: [],
  notes: undefined,
  min_salary: undefined,
  max_salary: undefined,
};

const schedule = (overrides: {
  id?: string;
  kind: string;
  custom_label?: string;
  scheduled_at?: string;
  url?: string;
}) => ({
  id: overrides.id ?? "schedule-1",
  kind: overrides.kind,
  custom_label: overrides.custom_label ?? "",
  scheduled_at: overrides.scheduled_at ?? "",
  url: overrides.url ?? "",
});

describe("jobFormSchema - 選考スケジュール", () => {
  it("有効なdatetime-local文字列はISO文字列に変換されてバリデーションを通過する", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      interview_schedules: [schedule({ kind: "first_interview", scheduled_at: "2026-08-07T18:30" })],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const expectedIso = new Date(2026, 7, 7, 18, 30).toISOString();
      expect(result.data.interview_schedules[0]?.scheduled_at).toBe(expectedIso);
    }
  });

  it("空文字の日時はundefinedとして扱われエラーにならない", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      interview_schedules: [schedule({ kind: "final_interview", scheduled_at: "" })],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interview_schedules[0]?.scheduled_at).toBeUndefined();
    }
  });

  it("不正な日時文字列の場合はバリデーションエラーになる", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      interview_schedules: [schedule({ kind: "first_interview", scheduled_at: "not-a-valid-datetime" })],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "interview_schedules.0.scheduled_at");
      expect(issue?.message).toBe("日時の形式が正しくありません");
    }
  });

  it("有効なURLはトリムされてバリデーションを通過する", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      interview_schedules: [schedule({ kind: "first_interview", url: "https://zoom.us/j/123" })],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interview_schedules[0]?.url).toBe("https://zoom.us/j/123");
    }
  });

  it("その他の選考は名称が必須", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      interview_schedules: [schedule({ kind: "other", custom_label: "" })],
    });

    expect(result.success).toBe(false);
  });

  it("buildInterviewPayloadFromForm は旧カラムへ同期する", () => {
    const parsed = jobFormSchema.parse({
      ...baseValues,
      interview_schedules: [
        schedule({ id: "1", kind: "first_interview", scheduled_at: "2026-08-07T18:30", url: "https://zoom.us/j/1" }),
      ],
    });

    const payload = buildInterviewPayloadFromForm(parsed.interview_schedules);
    expect(payload.first_interview_at).toBe(new Date(2026, 7, 7, 18, 30).toISOString());
    expect(payload.first_interview_url).toBe("https://zoom.us/j/1");
    expect(payload.interview_schedules).toHaveLength(1);
  });
});

describe("jobFormSchema - 回帰確認（必須項目・既存バリデーション）", () => {
  it("必須項目が揃っていれば面接日時なしでもバリデーションを通過する", () => {
    const result = jobFormSchema.safeParse(baseValues);
    expect(result.success).toBe(true);
  });

  it("company_nameが空の場合はエラーになる", () => {
    const result = jobFormSchema.safeParse({ ...baseValues, company_name: "" });
    expect(result.success).toBe(false);
  });

  it("min_salaryがmax_salaryより大きい場合はエラーになる", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      min_salary: 1000,
      max_salary: 500,
    });
    expect(result.success).toBe(false);
  });
});
