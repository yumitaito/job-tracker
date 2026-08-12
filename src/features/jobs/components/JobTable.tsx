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
import { JobStatusBadge } from "@/features/jobs/components/JobStatusBadge";
import { TechnologyBadges } from "@/features/jobs/components/TechnologyBadges";
import { getLatestInterview, INTERVIEW_STAGE_LABELS } from "@/features/jobs/lib/interview";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Job } from "@/features/jobs/types/job";

export function JobTable({
  jobs,
  onDeleteRequest,
}: {
  jobs: Job[];
  onDeleteRequest: (job: Job) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>企業名 / 職種</TableHead>
          <TableHead className="w-40">応募日</TableHead>
          <TableHead className="whitespace-nowrap">選考ステータス</TableHead>
          <TableHead className="w-44">面接日時</TableHead>
          <TableHead className="w-40">最終更新日</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const latestInterview = getLatestInterview(job);
          return (
            <TableRow key={job.id} className="group">
              <TableCell>
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
              <TableCell className="text-sm text-muted-foreground">
                {job.application_date ? formatDate(job.application_date) : null}
              </TableCell>
              <TableCell>
                <JobStatusBadge status={job.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {latestInterview ? (
                  <div>
                    <p className="font-bold text-foreground">
                      {INTERVIEW_STAGE_LABELS[latestInterview.stage]}
                    </p>
                    <p>{formatDateTime(latestInterview.at)}</p>
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(job.updated_at)}
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
