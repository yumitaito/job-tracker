import { getTodayDateInputValue, toDateTimeLocalInputValue } from "@/features/jobs/lib/datetime";
import { getJobInterviewSchedules } from "@/features/jobs/lib/interview-schedules";
import type { JobFormValues } from "@/features/jobs/schemas/job-schema";
import type { Job } from "@/features/jobs/types/job";

export function jobToFormValues(job: Job): JobFormValues {
  return {
    company_name: job.company_name,
    position: job.position,
    employment_type: job.employment_type ?? "",
    application_url: job.application_url ?? "",
    application_date: job.application_date ?? "",
    status: job.status,
    desire_level: job.desire_level,
    interview_schedules: getJobInterviewSchedules(job).map((schedule) => ({
      id: schedule.id,
      kind: schedule.kind,
      custom_label: schedule.custom_label ?? "",
      scheduled_at: toDateTimeLocalInputValue(schedule.scheduled_at),
      url: schedule.url ?? "",
    })),
    location: job.location ?? "",
    technologies: job.technologies ?? [],
    notes: job.notes ?? "",
    min_salary: job.min_salary ?? "",
    max_salary: job.max_salary ?? "",
  };
}

export function getDefaultJobFormValues(): JobFormValues {
  return {
    company_name: "",
    position: "",
    employment_type: "",
    application_url: "",
    application_date: getTodayDateInputValue(),
    status: "",
    desire_level: "medium",
    interview_schedules: [],
    location: "",
    technologies: [],
    notes: "",
    min_salary: "",
    max_salary: "",
  };
}
