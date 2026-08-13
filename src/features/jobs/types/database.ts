/**
 * Supabaseの`jobs`テーブルに対応するデータベース型。
 * supabase-jsのcreateClient<Database>()に渡すための最小限の型定義。
 */
import type { NotificationsDatabaseTables } from "@/features/notifications/types/database";
import type { JobStatus } from "./job";

type JobRow = {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  employment_type: string | null;
  application_url: string | null;
  application_date: string | null;
  status: JobStatus;
  first_interview_at: string | null;
  second_interview_at: string | null;
  final_interview_at: string | null;
  location: string | null;
  technologies: string[] | null;
  notes: string | null;
  min_salary: number | null;
  max_salary: number | null;
  created_at: string;
  updated_at: string;
};

type JobInsert = {
  id?: string;
  // DB側でdefault auth.uid()が設定されているため、クライアントから指定する必要はない
  user_id?: string;
  company_name: string;
  position: string;
  employment_type?: string | null;
  application_url?: string | null;
  application_date?: string | null;
  status?: JobStatus;
  first_interview_at?: string | null;
  second_interview_at?: string | null;
  final_interview_at?: string | null;
  location?: string | null;
  technologies?: string[] | null;
  notes?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  created_at?: string;
  updated_at?: string;
};

type JobUpdate = Partial<JobInsert>;

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: JobRow;
        Insert: JobInsert;
        Update: JobUpdate;
        Relationships: [];
      };
      push_subscriptions: NotificationsDatabaseTables["push_subscriptions"];
      interview_push_sent: NotificationsDatabaseTables["interview_push_sent"];
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
