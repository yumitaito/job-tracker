import { z } from "zod";
import { fromDateTimeLocalInputValue } from "@/features/jobs/lib/datetime";
import { DESIRE_LEVELS, JOB_STATUSES } from "@/features/jobs/types/job";

const optionalText = (max: number) =>
  z
    .string()
    .max(max, `${max}文字以内で入力してください`)
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined));

const optionalSalary = z
  .union([z.literal(""), z.coerce.number()])
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .pipe(z.number().min(0, "0以上の数値を入力してください").optional());

const optionalUrl = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined))
  .pipe(z.string().url("正しいURL形式で入力してください").optional());

const optionalDateTimeLocal = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined))
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    const iso = fromDateTimeLocalInputValue(value);
    if (!iso) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "日時の形式が正しくありません" });
      return z.NEVER;
    }
    return iso;
  });

export const jobFormSchema = z
  .object({
    company_name: z
      .string()
      .trim()
      .min(1, "企業名を入力してください")
      .max(200, "200文字以内で入力してください"),
    position: z
      .string()
      .trim()
      .min(1, "職種を入力してください")
      .max(200, "200文字以内で入力してください"),
    employment_type: optionalText(50),
    application_url: optionalUrl,
    application_date: optionalText(20),
    status: z.enum(JOB_STATUSES as [string, ...string[]], {
      message: "応募ステータスを選択してください",
    }),
    desire_level: z.enum(DESIRE_LEVELS as [string, ...string[]], {
      message: "志望度を選択してください",
    }),
    first_interview_at: optionalDateTimeLocal,
    second_interview_at: optionalDateTimeLocal,
    final_interview_at: optionalDateTimeLocal,
    location: optionalText(200),
    technologies: z.array(z.string().trim().min(1)).default([]),
    notes: optionalText(2000),
    min_salary: optionalSalary,
    max_salary: optionalSalary,
  })
  .refine(
    (data) =>
      data.min_salary === undefined ||
      data.max_salary === undefined ||
      data.min_salary <= data.max_salary,
    {
      message: "最低年収は最高年収以下にしてください",
      path: ["max_salary"],
    },
  );

export type JobFormValues = z.input<typeof jobFormSchema>;
export type JobFormOutput = z.output<typeof jobFormSchema>;
