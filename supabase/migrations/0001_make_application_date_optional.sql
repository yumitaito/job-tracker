-- 既存のjobsテーブルに対して、application_dateを任意項目（NULL許容）に変更する。
-- 初めてjobsテーブルを作成する場合は不要（supabase/schema.sqlに反映済み）。
-- 既にsupabase/schema.sqlを実行済みの環境でのみ、SQL Editorで実行してください。

alter table public.jobs
  alter column application_date drop not null;
