// Supabase Edge Function: send-interview-reminders
//
// pg_cron などから1分ごとに呼び出し、面接開始5分前の Push 通知を送信する。
// 実行には service_role と VAPID 秘密鍵が必要（Supabase Secrets に登録）。
//
// 必要な Secrets:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (例: mailto:you@example.com)
// - CRON_SECRET (任意・呼び出し元認証用)

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

function isFiveMinutesBeforeInterview(at: string, now: Date): boolean {
  const interviewAt = new Date(at);
  if (Number.isNaN(interviewAt.getTime())) return false;

  const remainingMs = interviewAt.getTime() - now.getTime();
  if (remainingMs <= 0) return false;

  const minutes = remainingMs / 60_000;
  return minutes > 4 && minutes <= 5;
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
  }>,
  now: Date,
): InterviewCandidate[] {
  const candidates: InterviewCandidate[] = [];

  for (const job of jobs) {
    const entries: Array<[InterviewCandidate["stage"], string | null]> = [
      ["first_interview", job.first_interview_at],
      ["second_interview", job.second_interview_at],
      ["final_interview", job.final_interview_at],
    ];

    for (const [stage, at] of entries) {
      if (!at || !isFiveMinutesBeforeInterview(at, now)) continue;
      candidates.push({
        jobId: job.id,
        userId: job.user_id,
        companyName: job.company_name,
        stage,
        at,
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
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return jsonResponse({ ok: false, error: "認証に失敗しました" }, 401);
    }
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
      "id, user_id, company_name, first_interview_at, second_interview_at, final_interview_at",
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
    const { data: alreadySent } = await adminClient
      .from("interview_push_sent")
      .select("id")
      .eq("job_id", candidate.jobId)
      .eq("interview_stage", candidate.stage)
      .eq("interview_at", candidate.at)
      .maybeSingle();

    if (alreadySent) continue;

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
    const payload = JSON.stringify({
      title: "面接5分前です",
      body: `${candidate.companyName} — ${stageLabel}（${formatDateTime(candidate.at)}）`,
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
      const { error: insertError } = await adminClient.from("interview_push_sent").insert({
        user_id: candidate.userId,
        job_id: candidate.jobId,
        interview_stage: candidate.stage,
        interview_at: candidate.at,
      });

      if (insertError) {
        errors.push(insertError.message);
      } else {
        sentCount += 1;
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
