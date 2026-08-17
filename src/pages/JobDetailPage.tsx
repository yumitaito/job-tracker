import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  Briefcase,
  User,
  Link as LinkIcon,
  Calendar,
  CalendarClock,
  Tag,
  MapPin,
  Code2,
  JapaneseYen,
  Pencil,
  Trash2,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BackLink } from "@/components/layout/BackLink";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JobStatusBadge } from "@/features/jobs/components/JobStatusBadge";
import { DesireLevelBadge } from "@/features/jobs/components/DesireLevelBadge";
import { TechnologyBadges } from "@/features/jobs/components/TechnologyBadges";
import { CompanyAvatar } from "@/features/jobs/components/CompanyAvatar";
import { DeleteJobDialog } from "@/features/jobs/components/DeleteJobDialog";
import { QueryErrorState } from "@/features/jobs/components/QueryErrorState";
import { useJob } from "@/features/jobs/hooks/use-job";
import { useDeleteJob } from "@/features/jobs/hooks/use-delete-job";
import { JOB_STATUS_LABELS } from "@/features/jobs/types/job";
import { formatDate, formatDateTime, formatSalary } from "@/lib/format";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: job, isPending, isError, error, refetch } = useJob(id);
  const deleteJob = useDeleteJob();

  if (isPending) {
    return (
      <PageContainer className="space-y-6">
        <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="space-y-6">
        <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />
        <QueryErrorState message={error?.message} onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (!job) {
    return (
      <PageContainer className="space-y-6">
        <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-lg font-bold text-foreground">求人が見つかりませんでした</p>
            <p className="text-sm text-muted-foreground">
              指定された求人は削除されたか、URLが間違っている可能性があります。
            </p>
            <Button asChild>
              <Link to="/jobs">求人一覧に戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <CompanyAvatar name={job.company_name} className="size-14 text-lg" />
              <div className="space-y-2">
                <JobStatusBadge status={job.status} />
                <h1 className="text-2xl font-black text-foreground sm:text-3xl">
                  {job.company_name}
                </h1>
                <p className="text-muted-foreground">{job.position}</p>
                <TechnologyBadges technologies={job.technologies} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild>
                <Link to={`/jobs/${job.id}/edit`}>
                  <Pencil />
                  編集する
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 />
                削除
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem icon={<Building2 />} label="企業名" value={job.company_name} />
            <InfoItem icon={<Briefcase />} label="職種" value={job.position} />
            <InfoItem icon={<User />} label="雇用形態" value={job.employment_type} />
            <InfoItem
              icon={<LinkIcon />}
              label="応募先"
              value={
                job.application_url ? (
                  <a
                    href={job.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary underline-offset-2 hover:underline break-all"
                  >
                    {job.application_url}
                  </a>
                ) : null
              }
            />
            {job.application_date ? (
              <InfoItem icon={<Calendar />} label="応募日" value={formatDate(job.application_date)} />
            ) : null}
            <InfoItem icon={<Tag />} label="選考ステータス" value={<JobStatusBadge status={job.status} />} />
            <InfoItem icon={<Tag />} label="志望度" value={<DesireLevelBadge level={job.desire_level} />} />
            <InfoItem
              icon={<CalendarClock />}
              label={JOB_STATUS_LABELS.first_interview}
              value={
                job.first_interview_at || job.first_interview_url ? (
                  <InterviewInfoValue at={job.first_interview_at} url={job.first_interview_url} />
                ) : null
              }
            />
            <InfoItem
              icon={<CalendarClock />}
              label={JOB_STATUS_LABELS.second_interview}
              value={
                job.second_interview_at || job.second_interview_url ? (
                  <InterviewInfoValue at={job.second_interview_at} url={job.second_interview_url} />
                ) : null
              }
            />
            <InfoItem
              icon={<CalendarClock />}
              label={JOB_STATUS_LABELS.final_interview}
              value={
                job.final_interview_at || job.final_interview_url ? (
                  <InterviewInfoValue at={job.final_interview_at} url={job.final_interview_url} />
                ) : null
              }
            />
            <InfoItem icon={<MapPin />} label="勤務地" value={job.location} />
            <InfoItem
              icon={<Code2 />}
              label="使用技術"
              value={
                job.technologies && job.technologies.length > 0
                  ? job.technologies.join(", ")
                  : null
              }
            />
            <InfoItem icon={<JapaneseYen />} label="最低年収" value={formatSalary(job.min_salary)} />
            <InfoItem icon={<JapaneseYen />} label="最高年収" value={formatSalary(job.max_salary)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <span className="inline-block h-4 w-1 rounded-full bg-secondary" />
            選考メモ
          </h2>
          <div className="min-h-24 rounded-xl border border-border bg-muted/40 p-4 text-sm whitespace-pre-wrap text-foreground">
            {job.notes || <span className="text-muted-foreground">メモはありません</span>}
          </div>
          <p className="text-right text-xs text-muted-foreground">
            作成日時：{formatDateTime(job.created_at)} ／ 最終更新日：{formatDateTime(job.updated_at)}
          </p>
        </CardContent>
      </Card>

      <DeleteJobDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={deleteJob.isPending}
        companyName={job.company_name}
        onConfirm={() =>
          deleteJob.mutate(job.id, {
            onSuccess: () => navigate("/jobs"),
          })
        }
      />
    </PageContainer>
  );
}

function InterviewInfoValue({ at, url }: { at: string | null; url: string | null }) {
  const urlLink = url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-secondary underline-offset-2 hover:underline break-all"
    >
      {url}
    </a>
  ) : null;

  if (at && url) {
    return (
      <div className="space-y-1">
        <p>{formatDateTime(at)}</p>
        {urlLink}
      </div>
    );
  }

  if (at) return formatDateTime(at);
  return urlLink;
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 bg-card p-4">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="text-sm font-semibold text-foreground">
          {value || <span className="font-normal text-muted-foreground">未設定</span>}
        </div>
      </div>
    </div>
  );
}
