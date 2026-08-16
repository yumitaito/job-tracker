import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function JobDragHandle({
  label,
  attributes,
  listeners,
  className,
}: {
  label: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex shrink-0 touch-none cursor-grab items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted active:cursor-grabbing",
        className,
      )}
      aria-label={label}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-5" aria-hidden />
    </button>
  );
}
