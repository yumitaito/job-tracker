import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { cn } from "@/lib/utils";
import { CompanyAvatar } from "@/features/jobs/components/CompanyAvatar";
import { JobDragHandle } from "@/features/jobs/components/JobDragHandle";
import {
  JobListDesireLevelField,
  JobListInterviewField,
  JobListInterviewUrlField,
  JobListStatusField,
  type JobListFieldUpdater,
} from "@/features/jobs/components/JobListInlineFields";
import { JobTable } from "@/features/jobs/components/JobTable";
import { TechnologyBadges } from "@/features/jobs/components/TechnologyBadges";
import { isJobInterviewPast } from "@/features/jobs/lib/interview";
import { getPastInterviewSurfaceClassName } from "@/features/jobs/lib/job-list-styles";
import { reorderJobIds } from "@/features/jobs/lib/job-order";
import type { Job } from "@/features/jobs/types/job";

function SortableJobTableRow({
  job,
  onDeleteRequest,
  onUpdateJob,
  updatingJobId,
  reorderEnabled,
}: {
  job: Job;
  onDeleteRequest: (job: Job) => void;
  onUpdateJob: JobListFieldUpdater;
  updatingJobId: string | null;
  reorderEnabled: boolean;
}) {
  const isPastInterview = isJobInterviewPast(job);
  const isUpdating = updatingJobId === job.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: !reorderEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "group",
        getPastInterviewSurfaceClassName(isPastInterview),
        isDragging && "relative z-10 bg-muted/40 shadow-md",
      )}
    >
      {reorderEnabled && (
        <TableCell className="w-12 px-2">
          <JobDragHandle
            label={`${job.company_name}の並び替え`}
            attributes={attributes}
            listeners={listeners}
          />
        </TableCell>
      )}
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
        <JobListInterviewField job={job} onUpdate={onUpdateJob} isUpdating={isUpdating} />
      </TableCell>
      <TableCell className="align-top py-4">
        <JobListDesireLevelField job={job} onUpdate={onUpdateJob} isUpdating={isUpdating} />
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
}

export function JobSortableTable({
  jobs,
  onReorder,
  reorderEnabled,
  onDeleteRequest,
  onUpdateJob,
  updatingJobId = null,
}: {
  jobs: Job[];
  onReorder: (orderedIds: string[]) => void;
  reorderEnabled: boolean;
  onDeleteRequest: (job: Job) => void;
  onUpdateJob: JobListFieldUpdater;
  updatingJobId?: string | null;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!reorderEnabled) return;
    const { active, over } = event;
    if (!over) return;

    const jobIds = jobs.map((job) => job.id);
    const newIds = reorderJobIds(jobIds, String(active.id), String(over.id));
    if (newIds) onReorder(newIds);
  };

  if (!reorderEnabled) {
    return (
      <JobTable
        jobs={jobs}
        onDeleteRequest={onDeleteRequest}
        onUpdateJob={onUpdateJob}
        updatingJobId={updatingJobId}
      />
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-2" aria-label="並び替え" />
              <TableHead>企業名 / 職種</TableHead>
              <TableHead className="w-52">面接日時</TableHead>
              <TableHead className="w-24 whitespace-nowrap">志望度</TableHead>
              <TableHead className="min-w-40 whitespace-nowrap">選考ステータス</TableHead>
              <TableHead className="w-24 whitespace-nowrap">面接URL</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <SortableJobTableRow
                key={job.id}
                job={job}
                onDeleteRequest={onDeleteRequest}
                onUpdateJob={onUpdateJob}
                updatingJobId={updatingJobId}
                reorderEnabled={reorderEnabled}
              />
            ))}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  );
}
