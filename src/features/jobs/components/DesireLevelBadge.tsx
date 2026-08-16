import type { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { DESIRE_LEVEL_LABELS, type DesireLevel } from "@/features/jobs/types/job";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const DESIRE_LEVEL_VARIANT: Record<DesireLevel, BadgeVariant> = {
  high: "desireHigh",
  medium: "desireMedium",
  low: "desireLow",
};

export function DesireLevelBadge({ level }: { level: DesireLevel }) {
  return <Badge variant={DESIRE_LEVEL_VARIANT[level]}>{DESIRE_LEVEL_LABELS[level]}</Badge>;
}
