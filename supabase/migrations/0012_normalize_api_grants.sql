-- 空DBへのmigration再生時も、RLSを通したAPI操作に必要な権限だけを付与する。
revoke all on table public.jobs, public.push_subscriptions, public.interview_push_sent from anon;
grant select, insert, update, delete on table public.jobs, public.push_subscriptions to authenticated;
revoke all on table public.interview_push_sent from authenticated;
grant select, insert, update, delete on table public.jobs, public.push_subscriptions,
  public.interview_push_sent to service_role;
