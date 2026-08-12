import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/features/jobs/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabaseの環境変数が設定されていません。.env.exampleを参考に.envを作成してください（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
