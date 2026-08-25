-- セキュリティレビュー対応: Push購読所有権、並び替え、通知重複防止、入力制約

-- 同一endpointが複数ユーザーに残っている場合は最新の1件だけを残す。
delete from public.push_subscriptions older
using public.push_subscriptions newer
where older.endpoint = newer.endpoint
  and (older.created_at, older.id) < (newer.created_at, newer.id);

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_user_id_endpoint_key;
alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_key unique (endpoint);

create or replace function public.claim_push_subscription(
  subscription_endpoint text,
  subscription_p256dh text,
  subscription_auth text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if nullif(subscription_endpoint, '') is null
    or nullif(subscription_p256dh, '') is null
    or nullif(subscription_auth, '') is null then
    raise exception 'invalid push subscription' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (current_user_id, subscription_endpoint, subscription_p256dh, subscription_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        created_at = now();
end;
$$;

revoke all on function public.claim_push_subscription(text, text, text) from public;
grant execute on function public.claim_push_subscription(text, text, text) to authenticated;

create or replace function public.reorder_jobs(ordered_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  owned_count integer;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if ordered_ids is null then
    raise exception 'ordered_ids is required' using errcode = '22023';
  end if;
  if cardinality(ordered_ids) <> (select count(distinct value) from unnest(ordered_ids) as submitted(value)) then
    raise exception 'ordered_ids contains duplicates' using errcode = '22023';
  end if;

  select count(*) into owned_count from public.jobs where user_id = current_user_id;
  if cardinality(ordered_ids) <> owned_count
    or exists (
      select 1 from unnest(ordered_ids) as submitted(id)
      left join public.jobs j on j.id = submitted.id and j.user_id = current_user_id
      where j.id is null
    ) then
    raise exception 'ordered_ids must exactly match the current user jobs' using errcode = '22023';
  end if;

  update public.jobs j
  set display_order = ordered.ordinality - 1
  from unnest(ordered_ids) with ordinality as ordered(id, ordinality)
  where j.id = ordered.id and j.user_id = current_user_id;
end;
$$;

revoke all on function public.reorder_jobs(uuid[]) from public;
grant execute on function public.reorder_jobs(uuid[]) to authenticated;

alter table public.interview_push_sent
  drop constraint if exists interview_push_sent_interview_stage_check;
alter table public.interview_push_sent
  add column if not exists schedule_id text;
update public.interview_push_sent
set schedule_id = 'legacy:' || interview_stage
where schedule_id is null;
alter table public.interview_push_sent alter column schedule_id set not null;
alter table public.interview_push_sent
  drop constraint if exists interview_push_sent_job_id_interview_stage_interview_at_key;
alter table public.interview_push_sent
  add constraint interview_push_sent_job_schedule_key unique (job_id, schedule_id, interview_at);

alter table public.jobs add constraint jobs_min_salary_nonnegative_check
  check (min_salary is null or min_salary >= 0) not valid;
alter table public.jobs add constraint jobs_max_salary_nonnegative_check
  check (max_salary is null or max_salary >= 0) not valid;
alter table public.jobs add constraint jobs_text_lengths_check check (
  char_length(company_name) between 1 and 200
  and char_length(position) between 1 and 200
  and (employment_type is null or char_length(employment_type) <= 100)
  and (application_url is null or char_length(application_url) <= 2048)
  and (location is null or char_length(location) <= 500)
  and (notes is null or char_length(notes) <= 10000)
) not valid;
-- ISO 8601形式だけを例外なしでtimestamptzへ変換する。不正値はNULLを返す。
create or replace function public.try_parse_interview_timestamptz(value text)
returns timestamptz language plpgsql immutable
set search_path = public, pg_temp
as $$
begin
  if value is null or value !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$' then
    return null;
  end if;
  return value::timestamptz;
exception when others then
  return null;
end;
$$;
revoke all on function public.try_parse_interview_timestamptz(text) from public;
grant execute on function public.try_parse_interview_timestamptz(text) to authenticated, service_role;

create or replace function public.is_valid_interview_schedules(value jsonb)
returns boolean language plpgsql immutable
set search_path = public, pg_temp
as $$
declare item jsonb; schedule_ids text[] := '{}';
begin
  if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) > 50 then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item->'id') <> 'string'
      or length(item->>'id') not between 1 and 100
      or item->>'id' = any(schedule_ids)
      or item->>'kind' not in ('casual_interview','first_interview','second_interview','third_interview','final_interview','other')
      or (item ? 'custom_label' and item->'custom_label' <> 'null'::jsonb and (jsonb_typeof(item->'custom_label') <> 'string' or length(item->>'custom_label') > 100))
      or (item ? 'scheduled_at' and item->'scheduled_at' <> 'null'::jsonb and (jsonb_typeof(item->'scheduled_at') <> 'string' or public.try_parse_interview_timestamptz(item->>'scheduled_at') is null))
      or (item ? 'url' and item->'url' <> 'null'::jsonb and (jsonb_typeof(item->'url') <> 'string' or length(item->>'url') > 2048)) then
      return false;
    end if;
    schedule_ids := array_append(schedule_ids, item->>'id');
  end loop;
  return true;
end;
$$;
revoke all on function public.is_valid_interview_schedules(jsonb) from public;
grant execute on function public.is_valid_interview_schedules(jsonb) to authenticated, service_role;
alter table public.jobs add constraint jobs_interview_schedules_shape_check
  check (public.is_valid_interview_schedules(interview_schedules)) not valid;

-- service_roleから通知窓内の候補だけを取得する。SECURITY INVOKERのため権限昇格しない。
create or replace function public.get_interview_reminder_candidates(
  window_start timestamptz,
  window_end timestamptz
) returns table (
  job_id uuid, user_id uuid, company_name text, interview_stage text,
  schedule_id text, stage_label text, interview_at timestamptz, interview_url text
) language sql stable security invoker set search_path = public, pg_temp as $$
  with json_candidates as (
    select j.id job_id, j.user_id, j.company_name,
      schedule->>'kind' interview_stage, schedule->>'id' schedule_id,
      case when schedule->>'kind' = 'other'
        then coalesce(nullif(trim(schedule->>'custom_label'), ''), '選考')
        else case schedule->>'kind'
          when 'casual_interview' then 'カジュアル面談' when 'first_interview' then '一次面接'
          when 'second_interview' then '二次面接' when 'third_interview' then '三次面接'
          when 'final_interview' then '最終面接' else schedule->>'kind' end
      end stage_label,
      parsed.interview_at,
      nullif(schedule->>'url', '') interview_url
    from public.jobs j cross join lateral jsonb_array_elements(j.interview_schedules) schedule
    cross join lateral (select public.try_parse_interview_timestamptz(schedule->>'scheduled_at') interview_at) parsed
    -- NOT VALID制約より前から残る不正日時はNULLとなり、この1件だけを安全に除外する。
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
  )
  select * from json_candidates union all select * from legacy_candidates;
$$;
revoke all on function public.get_interview_reminder_candidates(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.get_interview_reminder_candidates(timestamptz, timestamptz) to service_role;
