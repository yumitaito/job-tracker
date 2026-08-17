import { useEffect, useState, type SyntheticEvent } from "react";
import { Input } from "@/components/ui/input";
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
import { INTERVIEW_STAGE_LABELS } from "@/features/jobs/lib/interview";
import { getInterviewDateTimeClassName } from "@/features/jobs/lib/job-list-styles";
import { getListEditableInterview } from "@/features/jobs/lib/list-editable-interview";
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

function stopRowNavigation(event: SyntheticEvent) {
  event.stopPropagation();
}

export function JobListInterviewField({ job, onUpdate, isUpdating, compact }: InlineFieldProps) {
  const editable = getListEditableInterview(job);
  const [value, setValue] = useState(() => toDateTimeLocalInputValue(editable.at));

  useEffect(() => {
    setValue(toDateTimeLocalInputValue(editable.at));
  }, [job.id, editable.at, editable.field]);

  const handleBlur = () => {
    const nextIso = value.trim() ? fromDateTimeLocalInputValue(value.trim()) : null;
    const currentIso = editable.at;

    if (nextIso === undefined) return;
    if ((nextIso ?? null) === (currentIso ?? null)) return;

    onUpdate(job.id, { [editable.field]: nextIso });
  };

  return (
    <div
      className={cn(compact ? "space-y-1" : "flex min-h-9 items-center")}
      onClick={stopRowNavigation}
      onPointerDown={stopRowNavigation}
    >
      {compact && (
        <p className="text-xs font-bold text-foreground">
          {INTERVIEW_STAGE_LABELS[editable.stage]}
        </p>
      )}
      <Input
        type="datetime-local"
        value={value}
        disabled={isUpdating}
        title={INTERVIEW_STAGE_LABELS[editable.stage]}
        aria-label={`${job.company_name}の${INTERVIEW_STAGE_LABELS[editable.stage]}`}
        className={cn(
          "h-9 w-full bg-white text-sm",
          compact && "h-8 text-xs",
          editable.at ? getInterviewDateTimeClassName(editable.at) : undefined,
        )}
        onChange={(event) => setValue(event.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}

export function JobListDesireLevelField({ job, onUpdate, isUpdating, compact }: InlineFieldProps) {
  return (
    <div
      className={cn(!compact && "flex min-h-9 items-center")}
      onClick={stopRowNavigation}
      onPointerDown={stopRowNavigation}
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
  return (
    <div
      className={cn(!compact && "flex min-h-9 items-center")}
      onClick={stopRowNavigation}
      onPointerDown={stopRowNavigation}
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
          aria-label={`${job.company_name}の選考ステータス`}
          className={cn("w-full min-w-[7.5rem] bg-white", compact ? "h-8 text-xs" : "h-9")}
        >
          <SelectValue />
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
