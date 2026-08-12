import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BG_COLORS = [
  "bg-violet-100 text-violet-600",
  "bg-pink-100 text-pink-600",
  "bg-lime-100 text-lime-700",
  "bg-sky-100 text-sky-600",
  "bg-amber-100 text-amber-600",
];

function colorFor(name: string) {
  const index = name.charCodeAt(0) % BG_COLORS.length;
  return BG_COLORS[index] ?? BG_COLORS[0];
}

export function CompanyAvatar({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
        colorFor(name || "?"),
        className,
      )}
    >
      {initial || <Building2 className="size-4" />}
    </div>
  );
}
