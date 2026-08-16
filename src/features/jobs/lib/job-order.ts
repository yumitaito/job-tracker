import { arrayMove } from "@dnd-kit/sortable";
import type { Job } from "@/features/jobs/types/job";

/** ドラッグ終了後の新しい並び順（job id の配列）を、Job 配列に反映する */
export function applyJobOrder(jobs: Job[], orderedIds: string[]): Job[] {
  const byId = new Map(jobs.map((job) => [job.id, job]));
  const reordered = orderedIds
    .map((id) => byId.get(id))
    .filter((job): job is Job => job !== undefined);

  // 並び替え対象外の id があれば末尾に残す（通常は発生しない）
  if (reordered.length !== jobs.length) {
    for (const job of jobs) {
      if (!orderedIds.includes(job.id)) {
        reordered.push(job);
      }
    }
  }

  return reordered;
}

/** active/over の id から arrayMove 後の id 配列を求める */
export function reorderJobIds(
  jobIds: string[],
  activeId: string,
  overId: string,
): string[] | null {
  const oldIndex = jobIds.indexOf(activeId);
  const newIndex = jobIds.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return null;
  }
  return arrayMove(jobIds, oldIndex, newIndex);
}

/** display_order を 0 から振り直すペイロード */
export function toDisplayOrderUpdates(orderedIds: string[]): { id: string; display_order: number }[] {
  return orderedIds.map((id, index) => ({ id, display_order: index }));
}
