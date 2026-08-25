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
  interview_schedules jsonb not null default '[]'::jsonb, -- 柔軟な選考スケジュール
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
  ),
  constraint jobs_min_salary_nonnegative_check check (min_salary is null or min_salary >= 0),
  constraint jobs_max_salary_nonnegative_check check (max_salary is null or max_salary >= 0),
  constraint jobs_text_lengths_check check (
    char_length(company_name) between 1 and 200
    and char_length(position) between 1 and 200
    and (employment_type is null or char_length(employment_type) <= 100)
    and (application_url is null or char_length(application_url) <= 2048)
    and (location is null or char_length(location) <= 500)
    and (notes is null or char_length(notes) <= 10000)
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
  unique (endpoint)
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

create table if not exists public.interview_push_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  interview_stage text not null,
  schedule_id text not null,
  interview_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique (job_id, schedule_id, interview_at)
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

-- endpointの所有者をログインユーザーへ原子的に移管する
create or replace function public.claim_push_subscription(
  subscription_endpoint text, subscription_p256dh text, subscription_auth text
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if nullif(subscription_endpoint, '') is null or nullif(subscription_p256dh, '') is null or nullif(subscription_auth, '') is null then
    raise exception 'invalid push subscription' using errcode = '22023';
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (current_user_id, subscription_endpoint, subscription_p256dh, subscription_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh,
    auth = excluded.auth, created_at = now();
end;
$$;
revoke all on function public.claim_push_subscription(text, text, text) from public;
grant execute on function public.claim_push_subscription(text, text, text) to authenticated;

-- 全IDの完全一致を検証し、1トランザクションで表示順を更新する
create or replace function public.reorder_jobs(ordered_ids uuid[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare current_user_id uuid := auth.uid(); owned_count integer;
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if ordered_ids is null then raise exception 'ordered_ids is required' using errcode = '22023'; end if;
  if cardinality(ordered_ids) <> (select count(distinct value) from unnest(ordered_ids) submitted(value)) then
    raise exception 'ordered_ids contains duplicates' using errcode = '22023';
  end if;
  select count(*) into owned_count from public.jobs where user_id = current_user_id;
  if cardinality(ordered_ids) <> owned_count or exists (
    select 1 from unnest(ordered_ids) submitted(id)
    left join public.jobs j on j.id = submitted.id and j.user_id = current_user_id where j.id is null
  ) then raise exception 'ordered_ids must exactly match the current user jobs' using errcode = '22023'; end if;
  update public.jobs j set display_order = ordered.ordinality - 1
  from unnest(ordered_ids) with ordinality ordered(id, ordinality)
  where j.id = ordered.id and j.user_id = current_user_id;
end;
$$;
revoke all on function public.reorder_jobs(uuid[]) from public;
grant execute on function public.reorder_jobs(uuid[]) to authenticated;

create or replace function public.try_parse_interview_timestamptz(value text)
returns timestamptz language plpgsql immutable set search_path = public, pg_temp as $$
begin
  if value is null or value !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$' then return null; end if;
  return value::timestamptz;
exception when others then return null;
end;
$$;
revoke all on function public.try_parse_interview_timestamptz(text) from public;
grant execute on function public.try_parse_interview_timestamptz(text) to authenticated, service_role;

create or replace function public.is_valid_interview_schedules(value jsonb)
returns boolean language plpgsql immutable set search_path = public, pg_temp as $$
declare item jsonb; schedule_ids text[] := '{}';
begin
  if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) > 50 then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'id') <> 'string'
      or length(item->>'id') not between 1 and 100
      or item->>'id' = any(schedule_ids)
      or item->>'kind' not in ('casual_interview','first_interview','second_interview','third_interview','final_interview','other')
      or (item ? 'custom_label' and item->'custom_label' <> 'null'::jsonb and (jsonb_typeof(item->'custom_label') <> 'string' or length(item->>'custom_label') > 100))
      or (item ? 'scheduled_at' and item->'scheduled_at' <> 'null'::jsonb and (jsonb_typeof(item->'scheduled_at') <> 'string' or public.try_parse_interview_timestamptz(item->>'scheduled_at') is null))
      or (item ? 'url' and item->'url' <> 'null'::jsonb and (jsonb_typeof(item->'url') <> 'string' or length(item->>'url') > 2048)) then return false; end if;
    schedule_ids := array_append(schedule_ids, item->>'id');
  end loop;
  return true;
end;
$$;
revoke all on function public.is_valid_interview_schedules(jsonb) from public;
grant execute on function public.is_valid_interview_schedules(jsonb) to authenticated, service_role;
alter table public.jobs add constraint jobs_interview_schedules_shape_check
  check (public.is_valid_interview_schedules(interview_schedules));

create or replace function public.get_interview_reminder_candidates(
  window_start timestamptz, window_end timestamptz
) returns table (
  job_id uuid, user_id uuid, company_name text, interview_stage text,
  schedule_id text, stage_label text, interview_at timestamptz, interview_url text
) language sql stable security invoker set search_path = public, pg_temp as $$
  with json_candidates as (
    select j.id job_id, j.user_id, j.company_name, schedule->>'kind' interview_stage,
      schedule->>'id' schedule_id,
      case when schedule->>'kind' = 'other' then coalesce(nullif(trim(schedule->>'custom_label'), ''), '選考')
        else case schedule->>'kind' when 'casual_interview' then 'カジュアル面談'
          when 'first_interview' then '一次面接' when 'second_interview' then '二次面接'
          when 'third_interview' then '三次面接' when 'final_interview' then '最終面接'
          else schedule->>'kind' end end stage_label,
      parsed.interview_at,
      nullif(schedule->>'url', '') interview_url
    from public.jobs j cross join lateral jsonb_array_elements(j.interview_schedules) schedule
    cross join lateral (select public.try_parse_interview_timestamptz(schedule->>'scheduled_at') interview_at) parsed
    -- 旧データに不正日時が残っていてもRPC全体を止めず、その候補だけ除外する。
    where parsed.interview_at > window_start and parsed.interview_at <= window_end
  ), legacy_candidates as (
    select j.id, j.user_id, j.company_name, legacy.stage, 'legacy:' || legacy.stage,
      legacy.label, legacy.at, legacy.url
    from public.jobs j cross join lateral (values
      ('casual_interview', 'カジュアル面談', j.casual_interview_at, j.casual_interview_url),
      ('first_interview', '一次面接', j.first_interview_at, j.first_interview_url),
      ('second_interview', '二次面接', j.second_interview_at, j.second_interview_url),
      ('final_interview', '最終面接', j.final_interview_at, j.final_interview_url)
    ) legacy(stage, label, at, url)
    where legacy.at > window_start and legacy.at <= window_end
      and not exists (select 1 from json_candidates jc
        where jc.job_id = j.id and jc.interview_stage = legacy.stage and jc.interview_at = legacy.at)
  ) select * from json_candidates union all select * from legacy_candidates;
$$;
revoke all on function public.get_interview_reminder_candidates(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.get_interview_reminder_candidates(timestamptz, timestamptz) to service_role;
