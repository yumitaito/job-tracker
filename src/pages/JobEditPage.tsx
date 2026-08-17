import { Link, useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BackLink } from "@/components/layout/BackLink";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JobForm } from "@/features/jobs/components/JobForm";
import { QueryErrorState } from "@/features/jobs/components/QueryErrorState";
import { useJob } from "@/features/jobs/hooks/use-job";
import { useUpdateJob } from "@/features/jobs/hooks/use-update-job";
import { jobToFormValues } from "@/features/jobs/lib/job-mappers";
import type { JobFormOutput } from "@/features/jobs/schemas/job-schema";
import type { DesireLevel, JobStatus, UpdateJobInput } from "@/features/jobs/types/job";

export default function JobEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isPending, isError, error, refetch } = useJob(id);
  const updateJob = useUpdateJob(id ?? "");

  if (isPending) {
    return (
      <PageContainer className="space-y-6">
        <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />
        <Card>
          <CardContent className="space-y-4 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
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

  const handleSubmit = (values: JobFormOutput) => {
    const input: UpdateJobInput = {
      company_name: values.company_name,
      position: values.position,
      employment_type: values.employment_type ?? null,
      application_url: values.application_url ?? null,
      application_date: values.application_date ?? null,
      status: values.status as JobStatus,
      desire_level: values.desire_level as DesireLevel,
      first_interview_at: values.first_interview_at ?? null,
      second_interview_at: values.second_interview_at ?? null,
      final_interview_at: values.final_interview_at ?? null,
      first_interview_url: values.first_interview_url ?? null,
      second_interview_url: values.second_interview_url ?? null,
      final_interview_url: values.final_interview_url ?? null,
      location: values.location ?? null,
      technologies: values.technologies.length > 0 ? values.technologies : null,
      notes: values.notes ?? null,
      min_salary: values.min_salary ?? null,
      max_salary: values.max_salary ?? null,
    };

    updateJob.mutate(input, {
      onSuccess: () => navigate("/jobs"),
    });
  };

  return (
    <PageContainer className="space-y-6">
      <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">求人を編集</h1>
        <p className="text-sm text-muted-foreground">求人情報を編集して保存してください。</p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <JobForm
            defaultValues={jobToFormValues(job)}
            submitLabel="保存する"
            isSubmitting={updateJob.isPending}
            submitError={updateJob.isError ? updateJob.error.message : null}
            onCancel={() => navigate("/jobs")}
            onSubmit={handleSubmit}
          />
          <p className="text-right text-xs text-muted-foreground">
            最終更新日：{new Date(job.updated_at).toLocaleString("ja-JP")}
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
