-- job-tracker: 選考ステータスの多段階化
--
-- 【破壊的変更のため、ユーザー自身が内容を確認の上、Supabase SQL Editorで実行してください】
--
-- 従来の2段階ステータス（'not_applied' | 'applied'）を、選考の進行が分かる8段階に拡張する。
--   1. not_applied         未応募
--   2. document_screening  書類選考中（旧 'applied' からの移行先）
--   3. first_interview     一次面接
--   4. second_interview    二次面接
--   5. final_interview     最終面接
--   6. offer               内定
--   7. rejected            不採用
--   8. withdrawn           辞退
--
-- 既存データのうち status = 'applied' の行は、意味的に最も近い 'document_screening' へ移行する。
-- 移行後、旧CHECK制約では許可されていた 'applied' は新しい制約では許可されなくなる。

-- 1. 既存のCHECK制約を外す
alter table public.jobs
  drop constraint if exists jobs_status_check;

-- 2. 既存データを移行（'applied' -> 'document_screening'）
update public.jobs
  set status = 'document_screening'
  where status = 'applied';

-- 3. 8段階を許可する新しいCHECK制約を追加
alter table public.jobs
  add constraint jobs_status_check check (status in (
    'not_applied',
    'document_screening',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
    'withdrawn'
  ));
