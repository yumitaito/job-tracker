import { describe, expect, it } from "vitest";
import { jobFormSchema } from "./job-schema";

const baseValues = {
  company_name: "テスト株式会社",
  position: "エンジニア",
  employment_type: undefined,
  application_url: undefined,
  application_date: undefined,
  status: "not_applied" as const,
  first_interview_at: undefined,
  second_interview_at: undefined,
  final_interview_at: undefined,
  location: undefined,
  technologies: [],
  notes: undefined,
  min_salary: undefined,
  max_salary: undefined,
};

describe("jobFormSchema - 面接日時（optionalDateTimeLocal）", () => {
  it("有効なdatetime-local文字列はISO文字列に変換されてバリデーションを通過する", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      first_interview_at: "2026-08-07T18:30",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const expectedIso = new Date(2026, 7, 7, 18, 30).toISOString();
      expect(result.data.first_interview_at).toBe(expectedIso);
    }
  });

  it("未入力（undefined）の場合はundefinedのままエラーにならない", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      second_interview_at: undefined,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.second_interview_at).toBeUndefined();
    }
  });

  it("空文字の場合はundefinedとして扱われエラーにならない", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      final_interview_at: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.final_interview_at).toBeUndefined();
    }
  });

  it("空白のみの文字列もundefinedとして扱われエラーにならない", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      first_interview_at: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.first_interview_at).toBeUndefined();
    }
  });

  it("不正な日時文字列の場合はバリデーションエラーになる", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      first_interview_at: "not-a-valid-datetime",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "first_interview_at");
      expect(issue?.message).toBe("日時の形式が正しくありません");
    }
  });

  it("3つの面接日時すべてに有効な値を設定できる", () => {
    const result = jobFormSchema.safeParse({
      ...baseValues,
      first_interview_at: "2026-01-10T10:00",
      second_interview_at: "2026-01-20T14:00",
      final_interview_at: "2026-02-01T16:30",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.first_interview_at).toBe(new Date(2026, 0, 10, 10, 0).toISOString());
      expect(result.data.second_interview_at).toBe(new Date(2026, 0, 20, 14, 0).toISOString());
      expect(result.data.final_interview_at).toBe(new Date(2026, 1, 1, 16, 30).toISOString());
    }
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
