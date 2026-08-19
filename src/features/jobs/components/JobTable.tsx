import { Link } from "react-router-dom";
import { FileText, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "@/features/jobs/components/CompanyAvatar";
import {
  JobListDesireLevelField,
  JobListInterviewField,
  JobListInterviewUrlField,
  JobListStatusField,
  type JobListFieldUpdater,
} from "@/features/jobs/components/JobListInlineFields";
import { TechnologyBadges } from "@/features/jobs/components/TechnologyBadges";
import { getJobListSurfaceClassName } from "@/features/jobs/lib/job-list-styles";
import { cn } from "@/lib/utils";
import type { Job } from "@/features/jobs/types/job";

export function JobTable({
  jobs,
  onDeleteRequest,
  onUpdateJob,
  updatingJobId = null,
}: {
  jobs: Job[];
  onDeleteRequest: (job: Job) => void;
  onUpdateJob: JobListFieldUpdater;
  updatingJobId?: string | null;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>企業名 / 職種</TableHead>
          <TableHead className="w-52">面接日時</TableHead>
          <TableHead className="w-24 whitespace-nowrap">志望度</TableHead>
          <TableHead className="min-w-40 whitespace-nowrap">選考ステータス</TableHead>
          <TableHead className="w-24 whitespace-nowrap">面接URL</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const isUpdating = updatingJobId === job.id;

          return (
            <TableRow
              key={job.id}
              className={cn("group", getJobListSurfaceClassName(job.status))}
            >
              <TableCell className="align-top py-4">
                <Link to={`/jobs/${job.id}`} className="flex items-center gap-3">
                  <CompanyAvatar name={job.company_name} />
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{job.company_name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{job.position}</span>
                      <TechnologyBadges technologies={job.technologies} />
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="align-top py-4">
                <JobListInterviewField
                  job={job}
                  onUpdate={onUpdateJob}
                  isUpdating={isUpdating}
                />
              </TableCell>
              <TableCell className="align-top py-4">
                <JobListDesireLevelField
                  job={job}
                  onUpdate={onUpdateJob}
                  isUpdating={isUpdating}
                />
              </TableCell>
              <TableCell className="align-top py-4">
                <JobListStatusField job={job} onUpdate={onUpdateJob} isUpdating={isUpdating} />
              </TableCell>
              <TableCell className="align-top py-4">
                <JobListInterviewUrlField job={job} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/jobs/${job.id}/edit`}>
                      <Pencil />
                      編集
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
