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
        statusApplied:
          "border-transparent bg-[var(--status-applied-bg)] text-[var(--status-applied-fg)]",
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
