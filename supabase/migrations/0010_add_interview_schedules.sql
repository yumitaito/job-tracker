-- 柔軟な選考スケジュール用 JSONB カラムを追加し、既存の固定4段階データを移行する。
-- 既存の *_interview_at / *_interview_url カラムは互換性のため残し、アプリ側で同期する。

alter table public.jobs
  add column if not exists interview_schedules jsonb not null default '[]'::jsonb;

-- 既存データを interview_schedules に移行（日時またはURLがある段階のみ）
update public.jobs
set interview_schedules = coalesce(
  (
    select jsonb_agg(entry order by sort_order)
    from (
      select 1 as sort_order, jsonb_build_object(
        'id', gen_random_uuid()::text,
        'kind', 'casual_interview',
        'scheduled_at', casual_interview_at,
        'url', casual_interview_url
      ) as entry
      where casual_interview_at is not null or nullif(trim(casual_interview_url), '') is not null
      union all
      select 2, jsonb_build_object(
        'id', gen_random_uuid()::text,
        'kind', 'first_interview',
        'scheduled_at', first_interview_at,
        'url', first_interview_url
      )
      where first_interview_at is not null or nullif(trim(first_interview_url), '') is not null
      union all
      select 3, jsonb_build_object(
        'id', gen_random_uuid()::text,
        'kind', 'second_interview',
        'scheduled_at', second_interview_at,
        'url', second_interview_url
      )
      where second_interview_at is not null or nullif(trim(second_interview_url), '') is not null
      union all
      select 4, jsonb_build_object(
        'id', gen_random_uuid()::text,
        'kind', 'final_interview',
        'scheduled_at', final_interview_at,
        'url', final_interview_url
      )
      where final_interview_at is not null or nullif(trim(final_interview_url), '') is not null
    ) entries
  ),
  '[]'::jsonb
)
where interview_schedules = '[]'::jsonb
  and (
    casual_interview_at is not null or nullif(trim(casual_interview_url), '') is not null
    or first_interview_at is not null or nullif(trim(first_interview_url), '') is not null
    or second_interview_at is not null or nullif(trim(second_interview_url), '') is not null
    or final_interview_at is not null or nullif(trim(final_interview_url), '') is not null
  );
