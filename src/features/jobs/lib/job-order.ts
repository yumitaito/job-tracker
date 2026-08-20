import { arrayMove } from "@dnd-kit/sortable";
import type { Job, JobStatus } from "@/features/jobs/types/job";

const PINNED_TOP_STATUSES: JobStatus[] = ["offer", "document_screening"];

function isPinnedTopStatus(status: JobStatus): boolean {
  return PINNED_TOP_STATUSES.includes(status);
}

/** 内定 → 書類選考中 → その他の順で先頭へ寄せる（各グループ内の相対順は維持） */
export function pinOfferJobsToTop(jobs: Job[]): Job[] {
  const pinnedGroups = PINNED_TOP_STATUSES.map(() => [] as Job[]);
  const others: Job[] = [];

  for (const job of jobs) {
    const pinnedIndex = PINNED_TOP_STATUSES.indexOf(job.status);
    if (pinnedIndex === -1) {
      others.push(job);
    } else {
      pinnedGroups[pinnedIndex].push(job);
    }
  }

  return [...pinnedGroups.flat(), ...others];
}

/** 手動並び替え結果を保存する前に、優先表示求人を先頭へ正規化する */
export function normalizeOrderedJobIds(jobs: Job[], orderedIds: string[]): string[] {
  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const knownIds = orderedIds.filter((id) => jobMap.has(id));
  const pinnedIds = PINNED_TOP_STATUSES.flatMap((status) =>
    knownIds.filter((id) => jobMap.get(id)?.status === status),
  );
  const others = knownIds.filter((id) => !isPinnedTopStatus(jobMap.get(id)!.status));
  const trailing = jobs.map((job) => job.id).filter((id) => !knownIds.includes(id));

  return [...pinnedIds, ...others, ...trailing];
}

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

  return pinOfferJobsToTop(reordered);
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
