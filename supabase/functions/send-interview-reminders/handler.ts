// Supabase Edge Function: send-interview-reminders
//
// pg_cron などから1分ごとに呼び出し、面接開始5分前〜直前までの間に Push 通知を送信する。
// 送信に失敗した場合は予約をロールバックし、次回以降のcron実行で再試行する。
// 実行には service_role と VAPID 秘密鍵が必要（Supabase Secrets に登録）。
//
// 必要な Secrets:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (例: mailto:you@example.com)
// - CRON_SECRET (必須・呼び出し元認証用。未設定の場合はリクエストを拒否する)

import { isCronAuthorized, shouldRollbackReminderReservation } from "../_shared/security.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type InterviewCandidate = {
  jobId: string;
  userId: string;
  companyName: string;
  stage: string;
  scheduleId: string;
  stageLabel: string;
  at: string;
  interviewUrl: string | null;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type OperationError = { message: string; code?: string };
export type ReminderDependencies = {
  cronSecret?: string;
  configured: boolean;
  getCandidates: () => Promise<{ data?: InterviewCandidate[]; error?: OperationError }>;
  reserve: (candidate: InterviewCandidate) => Promise<{ error?: OperationError }>;
  getSubscriptions: (
    userId: string,
  ) => Promise<{ data?: PushSubscriptionRow[]; error?: OperationError }>;
  rollback: (
    key: { jobId: string; scheduleId: string; at: string },
  ) => Promise<{ error?: OperationError }>;
  send: (subscription: PushSubscriptionRow, payload: string) => Promise<void>;
  deleteSubscription: (endpoint: string) => Promise<void>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createSendInterviewRemindersHandler(deps: ReminderDependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "POSTメソッドのみ対応しています" }, 405);
    }

    const cronSecret = deps.cronSecret;
    if (!cronSecret) {
      return jsonResponse(
        { ok: false, error: "サーバー設定が不足しています（CRON_SECRET未設定）" },
        500,
      );
    }
    const provided = req.headers.get("x-cron-secret");
    if (!isCronAuthorized(provided, cronSecret)) {
      return jsonResponse({ ok: false, error: "認証に失敗しました" }, 401);
    }

    if (!deps.configured) {
      return jsonResponse({ ok: false, error: "サーバー設定が不足しています" }, 500);
    }

    const { data: candidates = [], error: jobsError } = await deps.getCandidates();

    if (jobsError) {
      return jsonResponse({ ok: false, error: jobsError.message }, 500);
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const candidate of candidates) {
      // 送信前に一意制約（job_id, interview_stage, interview_at）で送信予約を確保する。
      // insertが成功した（＝他プロセスがまだ予約していない）場合のみ送信し、
      // 重複（23505）の場合は他プロセスが送信済み・送信中とみなしてスキップする。
      const { error: reserveError } = await deps.reserve(candidate);

      if (reserveError) {
        if (reserveError.code !== "23505") {
          errors.push(reserveError.message);
        }
        continue;
      }

      const { data: subscriptions, error: subscriptionsError } = await deps.getSubscriptions(
        candidate.userId,
      );

      if (subscriptionsError) {
        errors.push(subscriptionsError.message);
        const { error: rollbackError } = await deps.rollback({
          jobId: candidate.jobId,
          scheduleId: candidate.scheduleId,
          at: candidate.at,
        });
        if (rollbackError) errors.push(`予約ロールバック失敗: ${rollbackError.message}`);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        const { error: rollbackError } = await deps.rollback({
          jobId: candidate.jobId,
          scheduleId: candidate.scheduleId,
          at: candidate.at,
        });
        if (rollbackError) errors.push(`予約ロールバック失敗: ${rollbackError.message}`);
        continue;
      }

      const body = candidate.interviewUrl
        ? `${candidate.companyName} — ${candidate.stageLabel}（${
          formatDateTime(candidate.at)
        }）\n入室: ${candidate.interviewUrl}`
        : `${candidate.companyName} — ${candidate.stageLabel}（${formatDateTime(candidate.at)}）`;
      const payload = JSON.stringify({
        title: "面接5分前です",
        body,
        url: "/jobs",
      });

      let deliveredCount = 0;

      for (const subscription of subscriptions as PushSubscriptionRow[]) {
        try {
          await deps.send(subscription, payload);
          deliveredCount += 1;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await deps.deleteSubscription(subscription.endpoint);
          } else {
            errors.push(error instanceof Error ? error.message : String(error));
          }
        }
      }

      if (!shouldRollbackReminderReservation(deliveredCount)) {
        sentCount += 1;
      } else {
        // 送信を試みたが1件も配信できなかった場合、予約行をロールバックして
        // 次回cron実行時に再試行できるようにする（本人にまだ通知が届いていないため）。
        const { error: rollbackError } = await deps.rollback({
          jobId: candidate.jobId,
          scheduleId: candidate.scheduleId,
          at: candidate.at,
        });

        if (rollbackError) {
          errors.push(`予約ロールバック失敗: ${rollbackError.message}`);
        }
      }
    }

    return jsonResponse({
      ok: true,
      checked: candidates.length,
      sent: sentCount,
      errors,
    });
  };
}
