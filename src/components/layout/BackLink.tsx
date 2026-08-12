import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
