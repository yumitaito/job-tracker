-- job-tracker: 求人一覧の手動並び替え用 display_order カラムを追加
--
-- ユーザーごとに jobs.display_order の昇順で一覧のカスタム順を保持する。
-- 既存行には created_at 順で 0 から連番を付与する（追加のみ・データ削除なし）。
--
-- 新規セットアップの場合は supabase/schema.sql に反映済みのため、この migration の実行は不要。
-- 既に jobs テーブルを作成済みの環境でのみ、Supabase SQL Editor で実行してください。

alter table public.jobs
  add column if not exists display_order integer not null default 0;

-- 既存データ: ユーザー単位で created_at 昇順に 0, 1, 2, ... を付与
with ranked as (
  select
    id,
    row_number() over (partition by user_id order by created_at asc) - 1 as rn
  from public.jobs
)
update public.jobs as j
set display_order = ranked.rn
from ranked
where j.id = ranked.id;

create index if not exists jobs_user_id_display_order_idx
  on public.jobs (user_id, display_order);
