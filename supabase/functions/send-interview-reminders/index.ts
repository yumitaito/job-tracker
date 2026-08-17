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

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STAGE_LABELS: Record<string, string> = {
  first_interview: "一次面接日時",
  second_interview: "二次面接日時",
  final_interview: "最終面接日時",
};

type InterviewCandidate = {
  jobId: string;
  userId: string;
  companyName: string;
  stage: "first_interview" | "second_interview" | "final_interview";
  at: string;
  interviewUrl: string | null;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// 面接開始まで残り0分超5分以下かどうかを判定する。
// cronは1分間隔で実行されるため、送信失敗時に予約をロールバックしても
// この窓の間であれば次回以降のtickで再度候補として拾われ再試行できる。
// 重複送信は interview_push_sent への予約insert（一意制約・23505エラー時スキップ）で防止する。
function isWithinReminderWindow(at: string, now: Date): boolean {
  const interviewAt = new Date(at);
  if (Number.isNaN(interviewAt.getTime())) return false;

  const remainingMs = interviewAt.getTime() - now.getTime();
  if (remainingMs <= 0) return false;

  const minutes = remainingMs / 60_000;
  return minutes > 0 && minutes <= 5;
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

function collectInterviewCandidates(
  jobs: Array<{
    id: string;
    user_id: string;
    company_name: string;
    first_interview_at: string | null;
    second_interview_at: string | null;
    final_interview_at: string | null;
    first_interview_url: string | null;
    second_interview_url: string | null;
    final_interview_url: string | null;
  }>,
  now: Date,
): InterviewCandidate[] {
  const candidates: InterviewCandidate[] = [];

  for (const job of jobs) {
    const entries: Array<[InterviewCandidate["stage"], string | null, string | null]> = [
      ["first_interview", job.first_interview_at, job.first_interview_url],
      ["second_interview", job.second_interview_at, job.second_interview_url],
      ["final_interview", job.final_interview_at, job.final_interview_url],
    ];

    for (const [stage, at, interviewUrl] of entries) {
      if (!at || !isWithinReminderWindow(at, now)) continue;
      candidates.push({
        jobId: job.id,
        userId: job.user_id,
        companyName: job.company_name,
        stage,
        at,
        interviewUrl,
      });
    }
  }

  return candidates;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POSTメソッドのみ対応しています" }, 405);
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return jsonResponse({ ok: false, error: "サーバー設定が不足しています（CRON_SECRET未設定）" }, 500);
  }
  const provided = req.headers.get("x-cron-secret");
  if (provided !== cronSecret) {
    return jsonResponse({ ok: false, error: "認証に失敗しました" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return jsonResponse({ ok: false, error: "サーバー設定が不足しています" }, 500);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();
  const nowIso = now.toISOString();
  const windowEndIso = new Date(now.getTime() + 6 * 60_000).toISOString();

  const { data: jobs, error: jobsError } = await adminClient
    .from("jobs")
    .select(
      "id, user_id, company_name, first_interview_at, second_interview_at, final_interview_at, first_interview_url, second_interview_url, final_interview_url",
    )
    .or(
      [
        `and(first_interview_at.gte.${nowIso},first_interview_at.lte.${windowEndIso})`,
        `and(second_interview_at.gte.${nowIso},second_interview_at.lte.${windowEndIso})`,
        `and(final_interview_at.gte.${nowIso},final_interview_at.lte.${windowEndIso})`,
      ].join(","),
    );

  if (jobsError) {
    return jsonResponse({ ok: false, error: jobsError.message }, 500);
  }

  const candidates = collectInterviewCandidates(jobs ?? [], now);
  let sentCount = 0;
  const errors: string[] = [];

  for (const candidate of candidates) {
    // 送信前に一意制約（job_id, interview_stage, interview_at）で送信予約を確保する。
    // insertが成功した（＝他プロセスがまだ予約していない）場合のみ送信し、
    // 重複（23505）の場合は他プロセスが送信済み・送信中とみなしてスキップする。
    const { error: reserveError } = await adminClient.from("interview_push_sent").insert({
      user_id: candidate.userId,
      job_id: candidate.jobId,
      interview_stage: candidate.stage,
      interview_at: candidate.at,
    });

    if (reserveError) {
      if (reserveError.code !== "23505") {
        errors.push(reserveError.message);
      }
      continue;
    }

    const { data: subscriptions, error: subscriptionsError } = await adminClient
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", candidate.userId);

    if (subscriptionsError) {
      errors.push(subscriptionsError.message);
      continue;
    }

    if (!subscriptions || subscriptions.length === 0) continue;

    const stageLabel = STAGE_LABELS[candidate.stage] ?? candidate.stage;
    const body = candidate.interviewUrl
      ? `${candidate.companyName} — ${stageLabel}（${formatDateTime(candidate.at)}）\n入室: ${candidate.interviewUrl}`
      : `${candidate.companyName} — ${stageLabel}（${formatDateTime(candidate.at)}）`;
    const payload = JSON.stringify({
      title: "面接5分前です",
      body,
      url: "/jobs",
    });

    let delivered = false;

    for (const subscription of subscriptions as PushSubscriptionRow[]) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        delivered = true;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await adminClient
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);
        } else {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
    }

    if (delivered) {
      sentCount += 1;
    } else {
      // 送信を試みたが1件も配信できなかった場合、予約行をロールバックして
      // 次回cron実行時に再試行できるようにする（本人にまだ通知が届いていないため）。
      const { error: rollbackError } = await adminClient
        .from("interview_push_sent")
        .delete()
        .eq("user_id", candidate.userId)
        .eq("job_id", candidate.jobId)
        .eq("interview_stage", candidate.stage)
        .eq("interview_at", candidate.at);

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
});
