import { useState, type SyntheticEvent } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewDateTimePicker } from "@/features/jobs/components/InterviewDateTimePicker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fromDateTimeLocalInputValue, toDateTimeLocalInputValue } from "@/features/jobs/lib/datetime";
import { getInterviewDateTimeClassName, getJobStatusSelectClassName } from "@/features/jobs/lib/job-list-styles";
import { getJobListDisplayStatus } from "@/features/jobs/lib/job-display-status";
import { buildListInterviewDateUpdateInput, getListEditableInterview, shouldHideListInterviewDateTime } from "@/features/jobs/lib/list-editable-interview";
import { STATUS_GROUPS } from "@/features/jobs/lib/job-status-groups";
import {
  DESIRE_LEVELS,
  DESIRE_LEVEL_LABELS,
  JOB_STATUS_LABELS,
  type DesireLevel,
  type Job,
  type JobStatus,
  type UpdateJobInput,
} from "@/features/jobs/types/job";
import { cn } from "@/lib/utils";

export type JobListFieldUpdater = (jobId: string, input: UpdateJobInput) => void;

type InlineFieldProps = {
  job: Job;
  onUpdate: JobListFieldUpdater;
  isUpdating?: boolean;
  compact?: boolean;
};

/** 一覧の並び替えドラッグ中に、インライン操作がドラッグ開始しないよう止める */
export function stopSortablePointerDown(event: SyntheticEvent) {
  event.stopPropagation();
}

export function JobListInterviewField({ job, onUpdate, isUpdating, compact }: InlineFieldProps) {
  const editable = getListEditableInterview(job);
  const hideInterviewDateTime = shouldHideListInterviewDateTime(job);
  const syncKey = `${job.id}:${editable.field}:${editable.at ?? ""}:${job.status}`;
  const [value, setValue] = useState(() => toDateTimeLocalInputValue(editable.at));
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);

  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey);
    setValue(toDateTimeLocalInputValue(editable.at));
  }

  const handleChange = (nextValue: string) => {
    setValue(nextValue);

    if (hideInterviewDateTime || !editable.field) return;

    const nextIso = nextValue.trim() ? fromDateTimeLocalInputValue(nextValue.trim()) : null;
    const currentIso = editable.at;

    if (nextIso === undefined) return;
    if ((nextIso ?? null) === (currentIso ?? null)) return;

    onUpdate(job.id, buildListInterviewDateUpdateInput(job, editable, nextIso));
  };

  if (hideInterviewDateTime) {
    return null;
  }

  const fieldLabel = `${job.company_name}の${editable.label}`;

  return (
    <div
      className={cn(compact ? "space-y-1" : "flex min-h-9 items-center")}
      onClick={stopSortablePointerDown}
      onPointerDown={stopSortablePointerDown}
    >
      {compact && (
        <p className="text-xs font-bold text-foreground">{editable.label}</p>
      )}
      <InterviewDateTimePicker
        id={`job-list-interview-${job.id}`}
        value={value}
        onChange={handleChange}
        disabled={isUpdating || !editable.field}
        variant="inline"
        compact={compact}
        aria-label={fieldLabel}
        triggerClassName={
          editable.at ? getInterviewDateTimeClassName(editable.at) : undefined
        }
      />
    </div>
  );
}

export function JobListInterviewUrlField({ job, compact }: { job: Job; compact?: boolean }) {
  const editable = getListEditableInterview(job);
  if (!editable.url) return null;

  return (
    <div
      className={cn(compact ? "space-y-1" : "flex min-h-9 items-center")}
      onClick={stopSortablePointerDown}
      onPointerDown={stopSortablePointerDown}
    >
      {compact && <p className="text-xs font-semibold text-foreground">面接URL</p>}
      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn("shrink-0", compact ? "h-8 px-3 text-xs" : "h-9 px-4")}
      >
        <a
          href={editable.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${job.company_name}の${editable.label}に入室`}
        >
          <ExternalLink className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
          入室
        </a>
      </Button>
    </div>
  );
}

export function JobListDesireLevelField({ job, onUpdate, isUpdating, compact }: InlineFieldProps) {
  return (
    <div
      className={cn(!compact && "flex min-h-9 items-center")}
      onClick={stopSortablePointerDown}
      onPointerDown={stopSortablePointerDown}
    >
      <Select
        value={job.desire_level}
        disabled={isUpdating}
        onValueChange={(value) => {
          if (value === job.desire_level) return;
          onUpdate(job.id, { desire_level: value as DesireLevel });
        }}
      >
        <SelectTrigger
          aria-label={`${job.company_name}の志望度`}
          className={cn("w-full min-w-[4.5rem] bg-white", compact ? "h-8 text-xs" : "h-9")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DESIRE_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {DESIRE_LEVEL_LABELS[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function JobListStatusField({ job, onUpdate, isUpdating, compact }: InlineFieldProps) {
  const displayStatus = getJobListDisplayStatus(job);

  return (
    <div
      className={cn(!compact && "flex min-h-9 items-center")}
      onClick={stopSortablePointerDown}
      onPointerDown={stopSortablePointerDown}
    >
      <Select
        value={job.status}
        disabled={isUpdating}
        onValueChange={(value) => {
          if (value === job.status) return;
          onUpdate(job.id, { status: value as JobStatus });
        }}
      >
        <SelectTrigger
          aria-label={`${job.company_name}の選考ステータス: ${displayStatus.label}`}
          className={cn(
            "w-full min-w-[7.5rem]",
            getJobStatusSelectClassName(job),
            compact ? "h-8 text-xs" : "h-9",
          )}
        >
          <span className="truncate">{displayStatus.label}</span>
        </SelectTrigger>
        <SelectContent>
          {STATUS_GROUPS.map((group, index) => (
            <SelectGroup key={group.label}>
              {index > 0 && <SelectSeparator />}
              <SelectLabel>{group.label}</SelectLabel>
              {group.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {JOB_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
