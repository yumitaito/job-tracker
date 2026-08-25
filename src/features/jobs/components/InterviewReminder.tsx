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
import type { AuthUser } from "@/features/auth/types/auth";

const CHECK_INTERVAL_MS = 30_000;
const NOTIFIED_STORAGE_KEY_PREFIX = "job-tracker-interview-reminders";

type InterviewReminderAlert = {
  userId: string;
  key: string;
  companyName: string;
  stageLabel: string;
  at: string;
  url: string | null;
};

function getStorageKey(userId: string): string {
  return `${NOTIFIED_STORAGE_KEY_PREFIX}:${userId}`;
}

function loadNotifiedKeys(userId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(getStorageKey(userId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((item) => typeof item === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function saveNotifiedKeys(userId: string, keys: Set<string>) {
  sessionStorage.setItem(getStorageKey(userId), JSON.stringify([...keys]));
}

function InterviewReminderForUser({ user }: { user: AuthUser | null }) {
  const { data: jobs } = useJobs("application_date_desc", !!user);
  const [alerts, setAlerts] = useState<InterviewReminderAlert[]>([]);
  const notifiedKeysRef = useRef<Set<string>>(user ? loadNotifiedKeys(user.id) : new Set());

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
            userId: user.id,
            key,
            companyName: job.company_name,
            stageLabel: interview.label,
            at: interview.at,
            url: interview.url,
          });
        }
      }

      if (nextAlerts.length > 0) {
        saveNotifiedKeys(user.id, notifiedKeysRef.current);
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

  const visibleAlerts = user ? alerts.filter((alert) => alert.userId === user.id) : [];
  if (!user || visibleAlerts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-lg flex-col gap-2 px-4"
      aria-live="assertive"
    >
      {visibleAlerts.map((alert) => (
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

export function InterviewReminder() {
  const { user } = useAuth();
  // ユーザー変更時に内部state/ref/intervalをまとめて破棄する
  return <InterviewReminderForUser key={user?.id ?? "guest"} user={user} />;
}
