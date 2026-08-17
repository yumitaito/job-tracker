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
import { cn } from "@/lib/utils";
import { JobCard } from "@/features/jobs/components/JobCard";
import { JobDragHandle } from "@/features/jobs/components/JobDragHandle";
import type { JobListFieldUpdater } from "@/features/jobs/components/JobListInlineFields";
import { reorderJobIds } from "@/features/jobs/lib/job-order";
import type { Job } from "@/features/jobs/types/job";

function SortableJobCardItem({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: !reorderEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-stretch gap-1", isDragging && "relative z-10 opacity-90")}
    >
      {reorderEnabled && (
        <JobDragHandle
          label={`${job.company_name}の並び替え`}
          attributes={attributes}
          listeners={listeners}
          className="self-center"
        />
      )}
      <div className="min-w-0 flex-1">
        <JobCard
          job={job}
          onDeleteRequest={onDeleteRequest}
          onUpdateJob={onUpdateJob}
          updatingJobId={updatingJobId}
        />
      </div>
    </div>
  );
}

export function JobSortableCardList({
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
      <div className="grid grid-cols-1 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onDeleteRequest={onDeleteRequest}
            onUpdateJob={onUpdateJob}
            updatingJobId={updatingJobId}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <SortableJobCardItem
              key={job.id}
              job={job}
              onDeleteRequest={onDeleteRequest}
              onUpdateJob={onUpdateJob}
              updatingJobId={updatingJobId}
              reorderEnabled={reorderEnabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
