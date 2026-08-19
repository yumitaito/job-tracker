import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JOB_LIST_STATUS_FILTER_GROUPS,
  JOB_LIST_TOP_LEVEL_STATUSES,
} from "@/features/jobs/lib/job-list-filters";
import {
  JOB_SORT_LABELS,
  JOB_STATUS_LABELS,
  type JobSortOption,
  type JobStatusFilter,
} from "@/features/jobs/types/job";

const SORT_OPTIONS = Object.keys(JOB_SORT_LABELS) as JobSortOption[];

function getFilterPillClassName(active: boolean): string {
  return cn(
    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
    active
      ? "border-transparent bg-secondary text-secondary-foreground shadow-sm"
      : "border-border bg-white text-foreground hover:bg-muted",
  );
}

function FilterPillCount({ active, count }: { active: boolean; count: number }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs",
        active ? "bg-white/25" : "bg-muted text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

function FilterPillButton({
  active,
  label,
  count,
  showChevron = false,
  ...props
}: ComponentProps<"button"> & {
  active: boolean;
  label: string;
  count: number;
  showChevron?: boolean;
}) {
  return (
    <button type="button" className={getFilterPillClassName(active)} {...props}>
      {label}
      <FilterPillCount active={active} count={count} />
      {showChevron && (
        <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden="true" />
      )}
    </button>
  );
}

function StatusFilterGroupDropdown({
  group,
  status,
  counts,
  onStatusChange,
}: {
  group: (typeof JOB_LIST_STATUS_FILTER_GROUPS)[number];
  status: JobStatusFilter;
  counts: Record<JobStatusFilter, number>;
  onStatusChange: (status: JobStatusFilter) => void;
}) {
  const activeStatus = group.statuses.find((value) => status === value);
  const groupActive = Boolean(activeStatus);
  const groupCount = group.statuses.reduce((sum, value) => sum + (counts[value] ?? 0), 0);
  const label = groupActive ? JOB_STATUS_LABELS[activeStatus!] : group.label;
  const count = groupActive ? (counts[activeStatus!] ?? 0) : groupCount;

  return (
    <Select
      value={groupActive ? status : undefined}
      onValueChange={(value) => onStatusChange(value as JobStatusFilter)}
    >
      <SelectPrimitive.Trigger asChild>
        <FilterPillButton
          active={groupActive}
          label={label}
          count={count}
          showChevron
          aria-label={`${group.label}のステータスで絞り込む`}
        />
      </SelectPrimitive.Trigger>
      <SelectContent align="start">
        {group.statuses.map((value) => (
          <SelectItem key={value} value={value}>
            {JOB_STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <FilterPillButton
          active={status === "all"}
          label="すべて"
          count={counts.all ?? 0}
          onClick={() => onStatusChange("all")}
        />

        {JOB_LIST_STATUS_FILTER_GROUPS.map((group) => (
          <StatusFilterGroupDropdown
            key={group.label}
            group={group}
            status={status}
            counts={counts}
            onStatusChange={onStatusChange}
          />
        ))}

        {JOB_LIST_TOP_LEVEL_STATUSES.map((value) => (
          <FilterPillButton
            key={value}
            active={status === value}
            label={JOB_STATUS_LABELS[value]}
            count={counts[value] ?? 0}
            onClick={() => onStatusChange(value)}
          />
        ))}
      </div>

      <Select value={sort} onValueChange={(value) => onSortChange(value as JobSortOption)}>
        <SelectTrigger className="w-full shrink-0 lg:w-48">
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
