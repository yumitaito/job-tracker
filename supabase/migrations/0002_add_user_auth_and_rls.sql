-- job-tracker: 複数ユーザー対応（Supabase Auth + RLS）
-- 既存の jobs テーブルに user_id を追加し、
-- 「自分が作成した求人だけ操作できる」RLSポリシーへ切り替える。
--
-- 【重要】このマイグレーションは既存データを削除・変更しない。
-- ただし、実行後は user_id が未設定（NULL）の既存行は
-- どのユーザーからも取得・更新・削除できなくなる（安全側に倒した挙動）。
-- 自分がSupabase Auth上で作成したアカウントに既存データを引き継ぎたい場合は、
-- サインアップ後に本ファイル末尾のbackfill SQLを実行してください。
--
-- Supabase SQL Editorで実行してください。

-- 1. user_idカラムを追加（NULL許容・新規行はログインユーザーのIDが自動設定される）
alter table public.jobs
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

create index if not exists jobs_user_id_idx on public.jobs (user_id);

-- 既存環境でもポリシーが確実に適用されるよう、作成前にRLSを有効化する
alter table public.jobs enable row level security;

-- 2. 旧・全許可ポリシーを削除（個人利用前提だったため）
drop policy if exists "Allow all access to jobs" on public.jobs;

-- 3. 「自分の求人だけ操作可能」なポリシーを設定
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

-- ============================================================
-- 【任意・手動実行】既存データを自分のアカウントに引き継ぐ場合
-- ============================================================
-- 1. まずアプリの /signup で自分のアカウントを作成してください。
-- 2. Supabaseダッシュボード → Authentication → Users で自分のUser UID を確認してください。
-- 3. 下記のSQLの <YOUR_USER_ID> を実際のUUIDに置き換えて実行してください。
--
-- update public.jobs set user_id = '<YOUR_USER_ID>' where user_id is null;
--
-- 4.（任意）すべての行にuser_idが設定されたことを確認できたら、
--    以降の新規行にも必ずuser_idを必須にしたい場合は下記も実行してください。
--
-- alter table public.jobs alter column user_id set not null;
