begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

select ok((select relrowsecurity from pg_class where oid = 'public.jobs'::regclass), 'jobs RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.push_subscriptions'::regclass), 'push_subscriptions RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.interview_push_sent'::regclass), 'interview_push_sent RLS enabled');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test', '', now(), '{}', '{}', now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test', '', now(), '{}', '{}', now(), now());

insert into public.jobs (id, user_id, company_name, position, display_order)
values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A1', 'Engineer', 0),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'A2', 'Engineer', 1),
  ('b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'B1', 'Engineer', 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*)::integer from public.jobs), 2, 'user A sees only own jobs');
select is((select count(*)::integer from public.jobs where id = 'b0000000-0000-0000-0000-000000000001'), 0, 'user A cannot cross-read user B');
select throws_ok($$ insert into public.jobs (user_id, company_name, position) values ('20000000-0000-0000-0000-000000000002', 'cross', 'cross') $$, '42501', null, 'user A cannot insert as user B');
select lives_ok($$ update public.jobs set company_name = 'hacked' where id = 'b0000000-0000-0000-0000-000000000001' $$, 'cross-user update affects no rows');
select lives_ok($$ delete from public.jobs where id = 'b0000000-0000-0000-0000-000000000001' $$, 'cross-user delete affects no rows');
reset role;
select is((select company_name from public.jobs where id = 'b0000000-0000-0000-0000-000000000001'), 'B1', 'B row remains unchanged');
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok($$ update public.jobs set company_name = 'A1 updated' where id = 'a0000000-0000-0000-0000-000000000001' $$, 'owner can update own job');
select lives_ok($$ select public.reorder_jobs(array['a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001']::uuid[]) $$, 'owner can reorder exact set');
select is((select display_order from public.jobs where id = 'a0000000-0000-0000-0000-000000000002'), 0, 'reorder updates order');
select throws_ok($$ select public.reorder_jobs(array['a0000000-0000-0000-0000-000000000001']::uuid[]) $$, '22023', 'ordered_ids must exactly match the current user jobs', 'partial reorder rejected');
select throws_ok($$ select public.reorder_jobs(array['a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001']::uuid[]) $$, '22023', 'ordered_ids must exactly match the current user jobs', 'cross-user reorder rejected');
select is((select display_order from public.jobs where id = 'a0000000-0000-0000-0000-000000000002'), 0, 'failed reorder leaves previous order intact');
reset role;
create function public.test_reorder_failure() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.id = 'a0000000-0000-0000-0000-000000000001' then raise exception 'injected reorder failure'; end if;
  return new;
end $$;
create trigger test_reorder_failure before update of display_order on public.jobs
for each row execute function public.test_reorder_failure();
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok($$ select public.reorder_jobs(array['a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002']::uuid[]) $$, 'P0001', 'injected reorder failure', 'injected failure aborts reorder');
reset role;
select results_eq($$ select id, display_order from public.jobs where user_id = '10000000-0000-0000-0000-000000000001' order by id $$,
  $$ values ('a0000000-0000-0000-0000-000000000001'::uuid, 1), ('a0000000-0000-0000-0000-000000000002'::uuid, 0) $$,
  'reorder exception rolls back every row');
drop trigger test_reorder_failure on public.jobs;
drop function public.test_reorder_failure();
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok($$ insert into public.push_subscriptions(user_id, endpoint, p256dh, auth) values ('10000000-0000-0000-0000-000000000001','https://push.test/a','key','auth') $$, 'owner can directly insert own push subscription');
select throws_ok($$ insert into public.push_subscriptions(user_id, endpoint, p256dh, auth) values ('20000000-0000-0000-0000-000000000002','https://push.test/b','key','auth') $$, '42501', null, 'owner cannot directly insert another user push subscription');
select throws_ok($$ insert into public.interview_push_sent(user_id,job_id,interview_stage,schedule_id,interview_at) values ('10000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','first_interview','x',now()) $$, '42501', 'permission denied for table interview_push_sent', 'authenticated cannot write delivery log');

select lives_ok($$ select public.claim_push_subscription('https://push.test/shared', 'a-key', 'a-auth') $$, 'user A claims endpoint');
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select lives_ok($$ select public.claim_push_subscription('https://push.test/shared', 'b-key', 'b-auth') $$, 'user B atomically reclaims endpoint');
select is((select user_id::text from public.push_subscriptions where endpoint = 'https://push.test/shared'), '20000000-0000-0000-0000-000000000002', 'endpoint has one current owner');
select is((select count(*)::integer from public.push_subscriptions where endpoint = 'https://push.test/a'), 0, 'user B cannot read user A subscription');
select lives_ok($$ update public.push_subscriptions set p256dh = 'hacked' where endpoint = 'https://push.test/a' $$, 'cross-user push update affects no rows');
select lives_ok($$ delete from public.push_subscriptions where endpoint = 'https://push.test/a' $$, 'cross-user push delete affects no rows');
reset role;
select is((select p256dh from public.push_subscriptions where endpoint = 'https://push.test/a'), 'key', 'user A subscription remains unchanged');

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$ select count(*) from public.jobs $$, '42501', 'permission denied for table jobs', 'anon cannot read jobs');
select throws_ok($$ insert into public.jobs (company_name, position) values ('anon', 'anon') $$, '42501', 'permission denied for table jobs', 'anon cannot insert jobs');
select throws_ok($$ select public.claim_push_subscription('x','y','z') $$, '42501', null, 'anon cannot execute claim RPC');
select throws_ok($$ select public.reorder_jobs(array[]::uuid[]) $$, '42501', null, 'anon cannot execute reorder RPC');
select throws_ok($$ select count(*) from public.push_subscriptions $$, '42501', 'permission denied for table push_subscriptions', 'anon cannot read subscriptions');

reset role;
select ok(not has_function_privilege('anon', 'public.claim_push_subscription(text,text,text)', 'EXECUTE'), 'anon lacks claim execute');
select ok(not has_function_privilege('authenticated', 'public.get_interview_reminder_candidates(timestamptz,timestamptz)', 'EXECUTE'), 'authenticated lacks reminder candidate execute');
select ok(has_function_privilege('service_role', 'public.get_interview_reminder_candidates(timestamptz,timestamptz)', 'EXECUTE'), 'service role may read reminder candidates');

select * from finish();
rollback;
