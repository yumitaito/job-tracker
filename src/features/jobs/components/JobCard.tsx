import { Link } from "react-router-dom";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "@/features/jobs/components/CompanyAvatar";
import {
  JobListDesireLevelField,
  JobListInterviewField,
  JobListInterviewUrlField,
  JobListStatusField,
  stopSortablePointerDown,
  type JobListFieldUpdater,
} from "@/features/jobs/components/JobListInlineFields";
import { TechnologyBadges } from "@/features/jobs/components/TechnologyBadges";
import { getJobListSurfaceClassName } from "@/features/jobs/lib/job-list-styles";
import { cn } from "@/lib/utils";
import type { Job } from "@/features/jobs/types/job";

export function JobCard({
  job,
  onDeleteRequest,
  onUpdateJob,
  updatingJobId = null,
}: {
  job: Job;
  onDeleteRequest: (job: Job) => void;
  onUpdateJob: JobListFieldUpdater;
  updatingJobId?: string | null;
}) {
  const isUpdating = updatingJobId === job.id;

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm",
        getJobListSurfaceClassName(job.status),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/jobs/${job.id}`}
          className="flex flex-1 items-center gap-3 min-w-0"
          onPointerDown={stopSortablePointerDown}
        >
          <CompanyAvatar name={job.company_name} />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-bold text-foreground">{job.company_name}</p>
            <p className="text-sm text-muted-foreground">{job.position}</p>
          </div>
        </Link>
      </div>

      <TechnologyBadges technologies={job.technologies} />

      <div className="space-y-3 rounded-xl bg-muted/60 px-3 py-3">
        <JobListInterviewField
          job={job}
          onUpdate={onUpdateJob}
          isUpdating={isUpdating}
          compact
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">志望度</p>
            <JobListDesireLevelField
              job={job}
              onUpdate={onUpdateJob}
              isUpdating={isUpdating}
              compact
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">選考ステータス</p>
            <JobListStatusField
              job={job}
              onUpdate={onUpdateJob}
              isUpdating={isUpdating}
              compact
            />
          </div>
        </div>
        <JobListInterviewUrlField job={job} compact />
      </div>

      <div className="flex items-center gap-2" onPointerDown={stopSortablePointerDown}>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to={`/jobs/${job.id}/edit`}>
            <Pencil />
            編集
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to={`/jobs/${job.id}`}>
            <FileText />
            詳細
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDeleteRequest(job)}
          aria-label={`${job.company_name}の求人を削除`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
