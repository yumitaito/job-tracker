import { supabase } from "@/lib/supabase";

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function savePushSubscription(input: PushSubscriptionInput): Promise<void> {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) throw new Error(error.message);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) throw new Error(error.message);
}

export async function hasPushSubscription(): Promise<boolean> {
  const { data, error } = await supabase.from("push_subscriptions").select("id").limit(1);

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}
