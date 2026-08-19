import { z } from "zod";
import { fromDateTimeLocalInputValue } from "@/features/jobs/lib/datetime";
import { syncLegacyInterviewFields } from "@/features/jobs/lib/interview-schedules";
import {
  INTERVIEW_SCHEDULE_KINDS,
  type InterviewSchedule,
  type InterviewScheduleKind,
} from "@/features/jobs/types/interview-schedule";
import { DESIRE_LEVELS, JOB_STATUSES } from "@/features/jobs/types/job";
import type { CreateJobInput } from "@/features/jobs/types/job";

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

const interviewScheduleSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(INTERVIEW_SCHEDULE_KINDS as [string, ...string[]]),
    custom_label: optionalText(50),
    scheduled_at: optionalDateTimeLocal,
    url: optionalUrl,
  })
  .superRefine((value, ctx) => {
    if (value.kind === "other" && !value.custom_label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "選考名を入力してください",
        path: ["custom_label"],
      });
    }
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
    interview_schedules: z.array(interviewScheduleSchema).default([]),
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

/** フォームの選考スケジュールから API 送信用ペイロードを組み立てる */
export function buildInterviewPayloadFromForm(
  schedules: JobFormOutput["interview_schedules"],
): Pick<
  CreateJobInput,
  | "interview_schedules"
  | "casual_interview_at"
  | "first_interview_at"
  | "second_interview_at"
  | "final_interview_at"
  | "casual_interview_url"
  | "first_interview_url"
  | "second_interview_url"
  | "final_interview_url"
> {
  const normalized: InterviewSchedule[] = schedules.map((schedule) => ({
    id: schedule.id,
    kind: schedule.kind as InterviewScheduleKind,
    custom_label: schedule.custom_label ?? null,
    scheduled_at: schedule.scheduled_at ?? null,
    url: schedule.url ?? null,
  }));

  return {
    interview_schedules: normalized,
    ...syncLegacyInterviewFields(normalized),
  };
}
