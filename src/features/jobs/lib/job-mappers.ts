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
    location: job.location ?? "",
    technologies: job.technologies ?? [],
    notes: job.notes ?? "",
    min_salary: job.min_salary ?? "",
    max_salary: job.max_salary ?? "",
  };
}
