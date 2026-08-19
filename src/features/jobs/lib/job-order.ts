import { arrayMove } from "@dnd-kit/sortable";
import type { Job } from "@/features/jobs/types/job";

/** 内定（offer）の求人を常に先頭へ寄せる（各グループ内の相対順は維持） */
export function pinOfferJobsToTop(jobs: Job[]): Job[] {
  const offers: Job[] = [];
  const others: Job[] = [];

  for (const job of jobs) {
    if (job.status === "offer") {
      offers.push(job);
    } else {
      others.push(job);
    }
  }

  return [...offers, ...others];
}

/** 手動並び替え結果を保存する前に、内定求人を先頭へ正規化する */
export function normalizeOrderedJobIds(jobs: Job[], orderedIds: string[]): string[] {
  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const knownIds = orderedIds.filter((id) => jobMap.has(id));
  const offers = knownIds.filter((id) => jobMap.get(id)?.status === "offer");
  const others = knownIds.filter((id) => jobMap.get(id)?.status !== "offer");
  const trailing = jobs.map((job) => job.id).filter((id) => !knownIds.includes(id));

  return [...offers, ...others, ...trailing];
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
