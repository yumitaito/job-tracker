import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { JobListHero } from "@/features/jobs/components/JobListHero";
import { JobFilterBar } from "@/features/jobs/components/JobFilterBar";
import { JobSortableCardList } from "@/features/jobs/components/JobSortableCardList";
import { JobSortableTable } from "@/features/jobs/components/JobSortableTable";
import { JobListSkeleton } from "@/features/jobs/components/JobListSkeleton";
import { EmptyJobsState } from "@/features/jobs/components/EmptyJobsState";
import { QueryErrorState } from "@/features/jobs/components/QueryErrorState";
import { DeleteJobDialog } from "@/features/jobs/components/DeleteJobDialog";
import { useJobListFilters } from "@/features/jobs/hooks/use-job-list-filters";
import { useJobs } from "@/features/jobs/hooks/use-jobs";
import { useDeleteJob } from "@/features/jobs/hooks/use-delete-job";
import { useReorderJobs } from "@/features/jobs/hooks/use-reorder-jobs";
import { useUpdateJobFromList } from "@/features/jobs/hooks/use-update-job-from-list";
import { JOB_STATUSES } from "@/features/jobs/types/job";
import type { Job, JobStatusFilter, UpdateJobInput } from "@/features/jobs/types/job";

export default function JobListPage() {
  const { status, setStatus, sort, setSort } = useJobListFilters();
  const [jobPendingDelete, setJobPendingDelete] = useState<Job | null>(null);

  const { data: jobs, isPending, isError, error, refetch } = useJobs(sort);
  const deleteJob = useDeleteJob();
  const reorderJobs = useReorderJobs(sort, jobs ?? []);
  const updateJobFromList = useUpdateJobFromList();

  const canReorder = status === "all" && sort === "display_order_asc";
  const updatingJobId =
    updateJobFromList.isPending && updateJobFromList.variables
      ? updateJobFromList.variables.id
      : null;

  const handleUpdateJob = (jobId: string, input: UpdateJobInput) => {
    updateJobFromList.mutate({ id: jobId, input });
  };

  const counts = useMemo(() => {
    const base = { all: 0 } as Record<JobStatusFilter, number>;
    for (const s of JOB_STATUSES) base[s] = 0;
    if (!jobs) return base;
    base.all = jobs.length;
    for (const job of jobs) {
      base[job.status] += 1;
    }
    return base;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    if (status === "all") return jobs;
    return jobs.filter((job) => job.status === status);
  }, [jobs, status]);

  const handleConfirmDelete = () => {
    if (!jobPendingDelete) return;
    deleteJob.mutate(jobPendingDelete.id, {
      onSuccess: () => setJobPendingDelete(null),
    });
  };

  const handleReorder = (orderedIds: string[]) => {
    reorderJobs.mutate(orderedIds);
  };

  return (
    <PageContainer className="space-y-6">
      <AppHeader />
      <JobListHero />

      <section className="space-y-4">
        <JobFilterBar
          status={status}
          onStatusChange={setStatus}
          counts={counts}
          sort={sort}
          onSortChange={setSort}
        />

        {status !== "all" && (jobs?.length ?? 0) > 0 && (
          <p className="text-sm text-muted-foreground">
            並び替えは「すべて」表示のときのみ利用できます。
          </p>
        )}

        <Card>
          {isPending && <JobListSkeleton />}

          {isError && (
            <div className="p-8">
              <QueryErrorState message={error?.message} onRetry={() => refetch()} />
            </div>
          )}

          {!isPending && !isError && filteredJobs.length === 0 && (
            <EmptyJobsState filtered={status !== "all" && (jobs?.length ?? 0) > 0} />
          )}

          {!isPending && !isError && filteredJobs.length > 0 && (
            <>
              <div className="hidden md:block">
                <JobSortableTable
                  jobs={filteredJobs}
                  reorderEnabled={canReorder}
                  onReorder={handleReorder}
                  onDeleteRequest={setJobPendingDelete}
                  onUpdateJob={handleUpdateJob}
                  updatingJobId={updatingJobId}
                />
              </div>
              <div className="p-4 md:hidden">
                <JobSortableCardList
                  jobs={filteredJobs}
                  reorderEnabled={canReorder}
                  onReorder={handleReorder}
                  onDeleteRequest={setJobPendingDelete}
                  onUpdateJob={handleUpdateJob}
                  updatingJobId={updatingJobId}
                />
              </div>
            </>
          )}
        </Card>
      </section>

      <DeleteJobDialog
        open={Boolean(jobPendingDelete)}
        onOpenChange={(open) => !open && setJobPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteJob.isPending}
        companyName={jobPendingDelete?.company_name}
      />
    </PageContainer>
  );
}
