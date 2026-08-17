-- job-tracker: 面接入室URL（一次・二次・最終）
--
-- jobsテーブルに、一次・二次・最終面接の入室URLを記録するカラムを追加する。
-- いずれも任意項目（NULL許容）で、既存データへの影響はない（追加のみ・データ移行不要）。
-- 面接日時カラム（first/second/final_interview_at）とは独立しており、
-- 日時のみ・URLのみ・両方いずれも可。
--
-- 新規セットアップの場合は supabase/schema.sql に反映済みのため、このmigrationの実行は不要です。
-- 既にjobsテーブルを作成済みの環境でのみ、Supabase SQL Editorで実行してください。

alter table public.jobs
  add column if not exists first_interview_url text,
  add column if not exists second_interview_url text,
  add column if not exists final_interview_url text;
