import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useJobs } from "@/features/jobs/hooks/use-jobs";
import {
  getAllScheduledInterviewEntries,
  getInterviewReminderKey,
  isFiveMinutesBeforeInterview,
} from "@/features/jobs/lib/interview";
import { formatDateTime } from "@/lib/format";

const CHECK_INTERVAL_MS = 30_000;
const NOTIFIED_STORAGE_KEY = "job-tracker-interview-reminders";

type InterviewReminderAlert = {
  key: string;
  companyName: string;
  stageLabel: string;
  at: string;
  url: string | null;
};

function loadNotifiedKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((item) => typeof item === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function saveNotifiedKeys(keys: Set<string>) {
  sessionStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify([...keys]));
}

export function InterviewReminder() {
  const { user } = useAuth();
  const { data: jobs } = useJobs("application_date_desc", !!user);
  const [alerts, setAlerts] = useState<InterviewReminderAlert[]>([]);
  const notifiedKeysRef = useRef<Set<string>>(loadNotifiedKeys());

  useEffect(() => {
    if (!user || !jobs) return;

    const checkInterviews = () => {
      const now = new Date();
      const nextAlerts: InterviewReminderAlert[] = [];

      for (const job of jobs) {
        for (const interview of getAllScheduledInterviewEntries(job)) {
          if (!isFiveMinutesBeforeInterview(interview.at, now)) continue;

          const key = getInterviewReminderKey(job.id, interview.reminderStage, interview.at);
          if (notifiedKeysRef.current.has(key)) continue;

          notifiedKeysRef.current.add(key);
          nextAlerts.push({
            key,
            companyName: job.company_name,
            stageLabel: interview.label,
            at: interview.at,
            url: interview.url,
          });
        }
      }

      if (nextAlerts.length > 0) {
        saveNotifiedKeys(notifiedKeysRef.current);
        setAlerts((current) => [...current, ...nextAlerts]);
      }
    };

    checkInterviews();
    const intervalId = window.setInterval(checkInterviews, CHECK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [user, jobs]);

  const dismissAlert = (key: string) => {
    setAlerts((current) => current.filter((alert) => alert.key !== key));
  };

  if (!user || alerts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-lg flex-col gap-2 px-4"
      aria-live="assertive"
    >
      {alerts.map((alert) => (
        <Alert
          key={alert.key}
          variant="destructive"
          className="pointer-events-auto shadow-lg"
        >
          <AlertTriangle />
          <AlertTitle>面接5分前です</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              {alert.companyName} — {alert.stageLabel}（{formatDateTime(alert.at)}）
            </p>
            {alert.url ? (
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center font-semibold text-secondary underline-offset-2 hover:underline"
                aria-label={`${alert.companyName}の${alert.stageLabel}に入室`}
              >
                入室する
              </a>
            ) : null}
          </AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 size-8 text-destructive hover:bg-red-100"
            aria-label="通知を閉じる"
            onClick={() => dismissAlert(alert.key)}
          >
            <X className="size-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
