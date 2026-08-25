import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import { createSendInterviewRemindersHandler } from "./handler.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
const vapidSubject = Deno.env.get("VAPID_SUBJECT");
const configured = Boolean(
  supabaseUrl && serviceRoleKey && vapidPublicKey && vapidPrivateKey && vapidSubject,
);
const adminClient = configured ? createClient(supabaseUrl!, serviceRoleKey!) : null;
if (configured) webpush.setVapidDetails(vapidSubject!, vapidPublicKey!, vapidPrivateKey!);

const handler = createSendInterviewRemindersHandler({
  cronSecret: Deno.env.get("CRON_SECRET"),
  configured,
  getCandidates: async () => {
    const now = new Date();
    const { data, error } = await adminClient!.rpc("get_interview_reminder_candidates", {
      window_start: now.toISOString(),
      window_end: new Date(now.getTime() + 300_000).toISOString(),
    });
    return {
      error: error ?? undefined,
      data: (data ?? []).map((row: Record<string, string | null>) => ({
        jobId: row.job_id!,
        userId: row.user_id!,
        companyName: row.company_name!,
        stage: row.interview_stage!,
        scheduleId: row.schedule_id!,
        stageLabel: row.stage_label!,
        at: row.interview_at!,
        interviewUrl: row.interview_url,
      })),
    };
  },
  reserve: async (candidate) => {
    const { error } = await adminClient!.from("interview_push_sent").insert({
      user_id: candidate.userId,
      job_id: candidate.jobId,
      interview_stage: candidate.stage,
      schedule_id: candidate.scheduleId,
      interview_at: candidate.at,
    });
    return { error: error ?? undefined };
  },
  getSubscriptions: async (userId) => {
    const { data, error } = await adminClient!.from("push_subscriptions").select(
      "endpoint, p256dh, auth",
    ).eq("user_id", userId);
    return { data: data ?? undefined, error: error ?? undefined };
  },
  rollback: async ({ jobId, scheduleId, at }) => {
    const { error } = await adminClient!.from("interview_push_sent").delete().eq("job_id", jobId)
      .eq("schedule_id", scheduleId).eq("interview_at", at);
    return { error: error ?? undefined };
  },
  send: (subscription, payload) =>
    webpush.sendNotification({
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    }, payload).then(() => undefined),
  deleteSubscription: async (endpoint) => {
    await adminClient!.from("push_subscriptions").delete().eq("endpoint", endpoint);
  },
});

Deno.serve(handler);
