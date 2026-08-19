import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap w-fit",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-foreground",
        outline: "border-border bg-white text-muted-foreground",
        tech: "border-transparent bg-muted text-foreground font-medium",
        statusNotApplied:
          "border-transparent bg-[var(--status-not-applied-bg)] text-[var(--status-not-applied-fg)]",
        statusDocumentScreening:
          "border-transparent bg-[var(--status-document-screening-bg)] text-[var(--status-document-screening-fg)]",
        statusCasualInterview:
          "border-transparent bg-[var(--status-casual-interview-bg)] text-[var(--status-casual-interview-fg)]",
        statusFirstInterview:
          "border-transparent bg-[var(--status-first-interview-bg)] text-[var(--status-first-interview-fg)]",
        statusSecondInterview:
          "border-transparent bg-[var(--status-second-interview-bg)] text-[var(--status-second-interview-fg)]",
        statusFinalInterview:
          "border-transparent bg-[var(--status-final-interview-bg)] text-[var(--status-final-interview-fg)]",
        statusOffer:
          "border-[var(--status-offer-border)] bg-[var(--status-offer-bg)] text-[var(--status-offer-fg)]",
        statusRejected:
          "border-transparent bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]",
        statusWithdrawn:
          "border-transparent bg-[var(--status-withdrawn-bg)] text-[var(--status-withdrawn-fg)]",
        desireHigh:
          "border-transparent bg-[var(--desire-high-bg)] text-[var(--desire-high-fg)]",
        desireMedium:
          "border-transparent bg-[var(--desire-medium-bg)] text-[var(--desire-medium-fg)]",
        desireLow:
          "border-transparent bg-[var(--desire-low-bg)] text-[var(--desire-low-fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
