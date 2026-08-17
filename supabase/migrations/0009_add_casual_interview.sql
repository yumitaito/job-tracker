-- job-tracker: カジュアル面接ステータスと日時・URL
--
-- 選考ステータスに「カジュアル面接」を追加し、日時・入室URL用カラムも追加する。
-- いずれも任意項目（NULL許容）で、既存データへの影響はない（追加のみ・データ移行不要）。
--
-- 新規セットアップの場合は supabase/schema.sql に反映済みのため、このmigrationの実行は不要です。
-- 既にjobsテーブルを作成済みの環境でのみ、Supabase SQL Editorで実行してください。

alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add column if not exists casual_interview_at timestamptz,
  add column if not exists casual_interview_url text;

alter table public.jobs
  add constraint jobs_status_check check (status in (
    'not_applied',
    'document_screening',
    'casual_interview',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
    'withdrawn'
  ));

alter table public.interview_push_sent
  drop constraint if exists interview_push_sent_interview_stage_check;

alter table public.interview_push_sent
  add constraint interview_push_sent_interview_stage_check check (
    interview_stage in ('casual_interview', 'first_interview', 'second_interview', 'final_interview')
  );
