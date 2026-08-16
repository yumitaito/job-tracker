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
import { JobStatusBadge } from "@/features/jobs/components/JobStatusBadge";
import { TechnologyBadges } from "@/features/jobs/components/TechnologyBadges";
import { JobTable } from "@/features/jobs/components/JobTable";
import { getLatestInterview, INTERVIEW_STAGE_LABELS } from "@/features/jobs/lib/interview";
import { reorderJobIds } from "@/features/jobs/lib/job-order";
import { formatDate, formatDateTime, isToday } from "@/lib/format";
import type { Job } from "@/features/jobs/types/job";

function SortableJobTableRow({
  job,
  onDeleteRequest,
  reorderEnabled,
}: {
  job: Job;
  onDeleteRequest: (job: Job) => void;
  reorderEnabled: boolean;
}) {
  const latestInterview = getLatestInterview(job);
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
      className={cn("group", isDragging && "relative z-10 bg-muted/40 shadow-md")}
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
        {latestInterview ? (
          <div>
            <p className="font-bold text-foreground">
              {INTERVIEW_STAGE_LABELS[latestInterview.stage]}
            </p>
            <p
              className={
                isToday(latestInterview.at)
                  ? "whitespace-nowrap font-bold text-destructive"
                  : "whitespace-nowrap"
              }
            >
              {formatDateTime(latestInterview.at)}
            </p>
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        <JobStatusBadge status={job.status} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatDate(job.updated_at)}</TableCell>
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
}: {
  jobs: Job[];
  onReorder: (orderedIds: string[]) => void;
  reorderEnabled: boolean;
  onDeleteRequest: (job: Job) => void;
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
    return <JobTable jobs={jobs} onDeleteRequest={onDeleteRequest} />;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-2" aria-label="並び替え" />
              <TableHead>企業名 / 職種</TableHead>
              <TableHead className="w-44">面接日時</TableHead>
              <TableHead className="whitespace-nowrap">選考ステータス</TableHead>
              <TableHead className="w-40">最終更新日</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <SortableJobTableRow
                key={job.id}
                job={job}
                onDeleteRequest={onDeleteRequest}
                reorderEnabled={reorderEnabled}
              />
            ))}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  );
}
