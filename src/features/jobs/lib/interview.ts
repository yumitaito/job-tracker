import type { Job, JobStatus } from "@/features/jobs/types/job";

export type LatestInterview = {
  stage: Extract<JobStatus, "first_interview" | "second_interview" | "final_interview">;
  at: string;
};

/** 面接日時の見出しラベル（選考ステータスバッジ用の`JOB_STATUS_LABELS`とは別に用意する） */
export const INTERVIEW_STAGE_LABELS: Record<LatestInterview["stage"], string> = {
  first_interview: "一次面接日時",
  second_interview: "二次面接日時",
  final_interview: "最終面接日時",
};

/** 求人に登録されている面接日時をすべて返す（未入力は除外）。 */
export function getJobInterviews(job: Job): LatestInterview[] {
  const interviews: LatestInterview[] = [];
  if (job.first_interview_at) {
    interviews.push({ stage: "first_interview", at: job.first_interview_at });
  }
  if (job.second_interview_at) {
    interviews.push({ stage: "second_interview", at: job.second_interview_at });
  }
  if (job.final_interview_at) {
    interviews.push({ stage: "final_interview", at: job.final_interview_at });
  }
  return interviews;
}

/** 面接開始までの残り分数。過去・不正な日時の場合はnull。 */
export function getMinutesUntilInterview(
  at: string,
  now: Date = new Date(),
): number | null {
  const interviewAt = new Date(at);
  if (Number.isNaN(interviewAt.getTime())) return null;

  const remainingMs = interviewAt.getTime() - now.getTime();
  if (remainingMs <= 0) return null;

  return remainingMs / 60_000;
}

/** 面接開始まであと5分になったタイミングかどうか（4分超〜5分以下）。 */
export function isFiveMinutesBeforeInterview(
  at: string,
  now: Date = new Date(),
): boolean {
  const minutes = getMinutesUntilInterview(at, now);
  if (minutes === null) return false;
  return minutes > 4 && minutes <= 5;
}

/** 同一面接に対する通知の重複防止キー */
export function getInterviewReminderKey(jobId: string, stage: LatestInterview["stage"], at: string) {
  return `${jobId}:${stage}:${at}`;
}

/** 求人の面接日時のうち、最も選考が進んだ段階のものを1つ返す。未入力ならnull。 */
export function getLatestInterview(job: Job): LatestInterview | null {
  if (job.final_interview_at) return { stage: "final_interview", at: job.final_interview_at };
  if (job.second_interview_at) return { stage: "second_interview", at: job.second_interview_at };
  if (job.first_interview_at) return { stage: "first_interview", at: job.first_interview_at };
  return null;
}

type InterviewProximitySortKey = {
  /** 0=未来の面接あり, 1=過去のみ, 2=未設定 */
  bucket: 0 | 1 | 2;
  /** bucket内での並び替え用タイムスタンプ（ms） */
  timestamp: number;
};

function parseInterviewTimestamp(at: string): number | null {
  const timestamp = new Date(at).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

/** 面接日時が近い順の並び替えキーを返す。 */
export function getInterviewProximitySortKey(
  job: Job,
  now: Date = new Date(),
): InterviewProximitySortKey {
  const nowMs = now.getTime();
  const upcomingTimestamps = getJobInterviews(job)
    .map((interview) => parseInterviewTimestamp(interview.at))
    .filter((timestamp): timestamp is number => timestamp !== null && timestamp > nowMs)
    .sort((a, b) => a - b);

  if (upcomingTimestamps.length > 0) {
    return { bucket: 0, timestamp: upcomingTimestamps[0] };
  }

  const latestInterview = getLatestInterview(job);
  if (latestInterview) {
    const timestamp = parseInterviewTimestamp(latestInterview.at);
    if (timestamp !== null) {
      return { bucket: 1, timestamp };
    }
  }

  return { bucket: 2, timestamp: Number.MAX_SAFE_INTEGER };
}

/** 面接日時が近い順で求人を並び替える（元の配列は変更しない）。 */
export function sortJobsByUpcomingInterview(jobs: Job[], now: Date = new Date()): Job[] {
  return [...jobs].sort((left, right) => {
    const leftKey = getInterviewProximitySortKey(left, now);
    const rightKey = getInterviewProximitySortKey(right, now);

    if (leftKey.bucket !== rightKey.bucket) {
      return leftKey.bucket - rightKey.bucket;
    }

    if (leftKey.timestamp !== rightKey.timestamp) {
      return leftKey.timestamp - rightKey.timestamp;
    }

    return left.company_name.localeCompare(right.company_name, "ja");
  });
}
