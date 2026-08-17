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
  desire_level text not null default 'medium', -- 志望度（high / medium / low）
  casual_interview_at timestamptz, -- カジュアル面接日時（任意項目）
  first_interview_at timestamptz, -- 一次面接日時（任意項目）
  second_interview_at timestamptz, -- 二次面接日時（任意項目）
  final_interview_at timestamptz, -- 最終面接日時（任意項目）
  casual_interview_url text, -- カジュアル面接入室URL（任意項目）
  first_interview_url text, -- 一次面接入室URL（任意項目）
  second_interview_url text, -- 二次面接入室URL（任意項目）
  final_interview_url text, -- 最終面接入室URL（任意項目）
  location text,
  technologies text[],
  notes text,
  min_salary integer,
  max_salary integer,
  display_order integer not null default 0, -- 一覧の手動並び替え順（ユーザーごと）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_status_check check (status in (
    'not_applied',
    'document_screening',
    'casual_interview',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
    'withdrawn'
  )),
  constraint jobs_desire_level_check check (desire_level in ('high', 'medium', 'low')),
  constraint jobs_salary_range_check check (
    min_salary is null or max_salary is null or min_salary <= max_salary
  )
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_application_date_idx on public.jobs (application_date);
create index if not exists jobs_user_id_idx on public.jobs (user_id);
create index if not exists jobs_user_id_display_order_idx on public.jobs (user_id, display_order);

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

-- Web Push 通知
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

create table if not exists public.interview_push_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  interview_stage text not null check (
    interview_stage in ('casual_interview', 'first_interview', 'second_interview', 'final_interview')
  ),
  interview_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique (job_id, interview_stage, interview_at)
);

alter table public.push_subscriptions enable row level security;
alter table public.interview_push_sent enable row level security;

drop policy if exists "Users can view their own push subscriptions" on public.push_subscriptions;
create policy "Users can view their own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own push subscriptions" on public.push_subscriptions;
create policy "Users can insert their own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own push subscriptions" on public.push_subscriptions;
create policy "Users can update their own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own push subscriptions" on public.push_subscriptions;
create policy "Users can delete their own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
