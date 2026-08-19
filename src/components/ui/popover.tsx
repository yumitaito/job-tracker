import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

/** PopoverContent の viewport 内配置デフォルト */
export const POPOVER_CONTENT_PLACEMENT_PROPS = {
  align: "start",
  side: "bottom",
  sideOffset: 8,
  avoidCollisions: true,
  collisionPadding: 16,
  sticky: "partial",
} as const satisfies Partial<React.ComponentProps<typeof PopoverPrimitive.Content>>;

function getDefaultCollisionBoundary(): Element | undefined {
  if (typeof document === "undefined") return undefined;
  return document.documentElement;
}

function PopoverContent({
  className,
  align = POPOVER_CONTENT_PLACEMENT_PROPS.align,
  side = POPOVER_CONTENT_PLACEMENT_PROPS.side,
  sideOffset = POPOVER_CONTENT_PLACEMENT_PROPS.sideOffset,
  avoidCollisions = POPOVER_CONTENT_PLACEMENT_PROPS.avoidCollisions,
  collisionPadding = POPOVER_CONTENT_PLACEMENT_PROPS.collisionPadding,
  sticky = POPOVER_CONTENT_PLACEMENT_PROPS.sticky,
  collisionBoundary = getDefaultCollisionBoundary(),
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        side={side}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        collisionBoundary={collisionBoundary}
        sticky={sticky}
        className={cn(
          "z-50 w-auto max-h-[var(--radix-popper-available-height)] overflow-y-auto rounded-xl border border-border bg-white p-0 text-foreground shadow-md outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
