-- job-tracker: 面接日時の記録
--
-- jobsテーブルに、一次・二次・最終面接の日時を記録するカラムを追加する。
-- いずれも任意項目（NULL許容）で、既存データへの影響はない（追加のみ・データ移行不要）。
--
-- 新規セットアップの場合は supabase/schema.sql に反映済みのため、このmigrationの実行は不要です。
-- 既にjobsテーブルを作成済みの環境でのみ、Supabase SQL Editorで実行してください。

alter table public.jobs
  add column if not exists first_interview_at timestamptz,
  add column if not exists second_interview_at timestamptz,
  add column if not exists final_interview_at timestamptz;
