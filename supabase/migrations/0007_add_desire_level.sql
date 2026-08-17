-- job-tracker: 志望度（desire_level）カラムを追加
--
-- 必須項目。high / medium / low の3段階。既存行は medium をデフォルト付与。
--
-- 新規セットアップの場合は supabase/schema.sql に反映済みのため、この migration の実行は不要。
-- 既に jobs テーブルを作成済みの環境でのみ、Supabase SQL Editor で実行してください。

alter table public.jobs
  add column if not exists desire_level text not null default 'medium';

alter table public.jobs
  drop constraint if exists jobs_desire_level_check;

alter table public.jobs
  add constraint jobs_desire_level_check
  check (desire_level in ('high', 'medium', 'low'));
