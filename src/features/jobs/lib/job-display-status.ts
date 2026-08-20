import { isInterviewPast } from "@/features/jobs/lib/interview";
import { getListEditableInterview } from "@/features/jobs/lib/list-editable-interview";
import { STATUS_TO_SCHEDULE_KIND } from "@/features/jobs/types/interview-schedule";
import { JOB_STATUS_LABELS, type Job, type JobStatus } from "@/features/jobs/types/job";

export type JobListDisplayStatus = {
  /** 一覧 Select に表示するラベル（結果待ちを含む） */
  label: string;
  /** DB 上の選考ステータス */
  status: JobStatus;
  /** 面接終了後の結果待ち表示かどうか */
  isWaitingForResult: boolean;
};

export type InterviewResultStatus = keyof typeof STATUS_TO_SCHEDULE_KIND;

export function isInterviewResultStatus(
  status: JobStatus,
): status is InterviewResultStatus {
  return status in STATUS_TO_SCHEDULE_KIND;
}

/** 一覧表示用の選考ステータスを算出する（DB status は変更しない） */
export function getJobListDisplayStatus(
  job: Job,
  now: Date = new Date(),
): JobListDisplayStatus {
  const status = job.status;
  const baseLabel = JOB_STATUS_LABELS[status];

  if (!isInterviewResultStatus(status)) {
    return {
      label: baseLabel,
      status,
      isWaitingForResult: false,
    };
  }

  const interviewAt = getListEditableInterview(job).at;
  if (!interviewAt || !isInterviewPast(interviewAt, now)) {
    return {
      label: baseLabel,
      status,
      isWaitingForResult: false,
    };
  }

  return {
    label: `${baseLabel}・結果待ち`,
    status,
    isWaitingForResult: true,
  };
}
