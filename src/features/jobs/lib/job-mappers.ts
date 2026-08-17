import { toDateTimeLocalInputValue } from "@/features/jobs/lib/datetime";
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
    first_interview_at: toDateTimeLocalInputValue(job.first_interview_at),
    second_interview_at: toDateTimeLocalInputValue(job.second_interview_at),
    final_interview_at: toDateTimeLocalInputValue(job.final_interview_at),
    location: job.location ?? "",
    technologies: job.technologies ?? [],
    notes: job.notes ?? "",
    min_salary: job.min_salary ?? "",
    max_salary: job.max_salary ?? "",
  };
}
