import type { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, type JobStatus } from "@/features/jobs/types/job";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const STATUS_VARIANT: Record<JobStatus, BadgeVariant> = {
  not_applied: "statusNotApplied",
  document_screening: "statusDocumentScreening",
  casual_interview: "statusCasualInterview",
  first_interview: "statusFirstInterview",
  second_interview: "statusSecondInterview",
  final_interview: "statusFinalInterview",
  offer: "statusOffer",
  rejected: "statusRejected",
  withdrawn: "statusWithdrawn",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{JOB_STATUS_LABELS[status]}</Badge>;
}
