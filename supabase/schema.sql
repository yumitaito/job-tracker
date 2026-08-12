-- job-tracker: jobsテーブル定義（新規セットアップ用・複数ユーザー対応版）
-- Supabase SQL Editorで実行してください。
--
-- 既にjobsテーブルを作成済みの環境（user_idカラムがまだ無い状態）に対しては、
-- このファイルを再実行するのではなく、
-- supabase/migrations/0002_add_user_auth_and_rls.sql を実行してください。

create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  company_name text not null,
  position text not null,
  employment_type text,
  application_url text,
  application_date date,
  status text not null default 'not_applied',
  location text,
  technologies text[],
  notes text,
  min_salary integer,
  max_salary integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_status_check check (status in (
    'not_applied',
    'document_screening',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
    'withdrawn'
  )),
  constraint jobs_salary_range_check check (
    min_salary is null or max_salary is null or min_salary <= max_salary
  )
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_application_date_idx on public.jobs (application_date);
create index if not exists jobs_user_id_idx on public.jobs (user_id);

-- updated_atを更新のたびに自動更新するtrigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();

-- Row Level Security
-- 複数ユーザーがそれぞれアカウントを持つ想定のため、
-- 「自分（auth.uid()）が作成した求人だけ操作できる」ポリシーを設定する。
alter table public.jobs enable row level security;

drop policy if exists "Allow all access to jobs" on public.jobs;

drop policy if exists "Users can view their own jobs" on public.jobs;
create policy "Users can view their own jobs"
  on public.jobs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own jobs" on public.jobs;
create policy "Users can insert their own jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own jobs" on public.jobs;
create policy "Users can update their own jobs"
  on public.jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own jobs" on public.jobs;
create policy "Users can delete their own jobs"
  on public.jobs for delete
  using (auth.uid() = user_id);
