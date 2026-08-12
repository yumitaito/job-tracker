import { Link } from "react-router-dom";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "@/features/jobs/components/CompanyAvatar";
import { JobStatusBadge } from "@/features/jobs/components/JobStatusBadge";
import { TechnologyBadges } from "@/features/jobs/components/TechnologyBadges";
import { formatDate } from "@/lib/format";
import type { Job } from "@/features/jobs/types/job";

export function JobCard({
  job,
  onDeleteRequest,
}: {
  job: Job;
  onDeleteRequest: (job: Job) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/jobs/${job.id}`} className="flex flex-1 items-center gap-3 min-w-0">
          <CompanyAvatar name={job.company_name} />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-bold text-foreground">{job.company_name}</p>
            <p className="text-sm text-muted-foreground">{job.position}</p>
          </div>
        </Link>
        <JobStatusBadge status={job.status} />
      </div>

      <TechnologyBadges technologies={job.technologies} />

      <div
        className={`grid gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground ${
          job.application_date ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {job.application_date ? (
          <div>
            <p className="font-semibold text-foreground">応募日</p>
            <p>{formatDate(job.application_date)}</p>
          </div>
        ) : null}
        <div>
          <p className="font-semibold text-foreground">最終更新日</p>
          <p>{formatDate(job.updated_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
