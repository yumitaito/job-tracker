/**
 * Supabaseの`push_subscriptions` / `interview_push_sent`テーブルに対応するデータベース型。
 * supabase-jsのcreateClient<Database>()に渡すための最小限の型定義。
 */

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type PushSubscriptionInsert = {
  id?: string;
  user_id?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at?: string;
};

export type InterviewPushSentRow = {
  id: string;
  user_id: string;
  job_id: string;
  interview_stage: "casual_interview" | "first_interview" | "second_interview" | "final_interview";
  interview_at: string;
  sent_at: string;
};

export interface NotificationsDatabaseTables {
  push_subscriptions: {
    Row: PushSubscriptionRow;
    Insert: PushSubscriptionInsert;
    Update: Partial<PushSubscriptionInsert>;
    Relationships: [];
  };
  interview_push_sent: {
    Row: InterviewPushSentRow;
    Insert: Omit<InterviewPushSentRow, "id" | "sent_at"> & {
      id?: string;
      sent_at?: string;
    };
    Update: Partial<InterviewPushSentRow>;
    Relationships: [];
  };
}
