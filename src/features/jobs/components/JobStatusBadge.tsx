import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, type JobStatus } from "@/features/jobs/types/job";

const STATUS_VARIANT: Record<JobStatus, "statusNotApplied" | "statusApplied"> = {
  not_applied: "statusNotApplied",
  applied: "statusApplied",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{JOB_STATUS_LABELS[status]}</Badge>;
}
