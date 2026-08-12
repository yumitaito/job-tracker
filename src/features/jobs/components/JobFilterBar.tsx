import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JOB_SORT_LABELS,
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type JobSortOption,
  type JobStatusFilter,
} from "@/features/jobs/types/job";

const SORT_OPTIONS = Object.keys(JOB_SORT_LABELS) as JobSortOption[];

export function JobFilterBar({
  status,
  onStatusChange,
  counts,
  sort,
  onSortChange,
}: {
  status: JobStatusFilter;
  onStatusChange: (status: JobStatusFilter) => void;
  counts: Record<JobStatusFilter, number>;
  sort: JobSortOption;
  onSortChange: (sort: JobSortOption) => void;
}) {
  const filters: { value: JobStatusFilter; label: string }[] = [
    { value: "all", label: "すべて" },
    ...JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABELS[s] })),
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = status === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatusChange(filter.value)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                active
                  ? "border-transparent bg-secondary text-secondary-foreground shadow-sm"
                  : "border-border bg-white text-foreground hover:bg-muted",
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  active ? "bg-white/25" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[filter.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <Select value={sort} onValueChange={(value) => onSortChange(value as JobSortOption)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {JOB_SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
