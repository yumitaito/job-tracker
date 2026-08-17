import { JOB_STATUS_LABELS, type JobStatus } from "@/features/jobs/types/job";

export const STATUS_GROUPS: { label: string; statuses: JobStatus[] }[] = [
  { label: "応募状況", statuses: ["not_applied"] },
  {
    label: "選考中",
    statuses: ["document_screening", "casual_interview", "first_interview", "second_interview", "final_interview"],
  },
  { label: "結果", statuses: ["offer", "rejected", "withdrawn"] },
];

export function getJobStatusLabel(status: JobStatus): string {
  return JOB_STATUS_LABELS[status];
}
