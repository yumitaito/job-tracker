import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BackLink } from "@/components/layout/BackLink";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { JobForm } from "@/features/jobs/components/JobForm";
import { useCreateJob } from "@/features/jobs/hooks/use-create-job";
import type { JobFormOutput } from "@/features/jobs/schemas/job-schema";
import type { CreateJobInput, DesireLevel, JobStatus } from "@/features/jobs/types/job";

export default function JobNewPage() {
  const navigate = useNavigate();
  const createJob = useCreateJob();

  const handleSubmit = (values: JobFormOutput) => {
    const input: CreateJobInput = {
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

    createJob.mutate(input, {
      onSuccess: () => navigate("/jobs"),
    });
  };

  return (
    <PageContainer className="space-y-6">
      <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">求人を登録</h1>
        <p className="text-sm text-muted-foreground">応募する求人の情報を入力してください。</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <JobForm
            submitLabel="登録する"
            isSubmitting={createJob.isPending}
            submitError={createJob.isError ? createJob.error.message : null}
            onCancel={() => navigate("/jobs")}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
