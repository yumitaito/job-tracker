import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkSecurityContracts } from "./check-security-contracts.mjs";

async function fixture(frontend = "") {
  const root = await mkdtemp(path.join(os.tmpdir(), "security-contracts-"));
  await Promise.all(["src", "public", "supabase/migrations", ".github/workflows", "e2e"].map((dir) => mkdir(path.join(root, dir), { recursive: true })));
  await writeFile(path.join(root, "src/app.ts"), frontend);
  const sql = `
    create table public.jobs (interview_schedules jsonb); alter table public.jobs enable row level security;
    create policy own on public.jobs using (auth.uid() = user_id);
    create table public.push_subscriptions (endpoint text, unique (endpoint)); alter table public.push_subscriptions enable row level security;
    create policy own_push on public.push_subscriptions using (auth.uid() = user_id);
    create table public.interview_push_sent(id uuid); alter table public.interview_push_sent enable row level security;
    create function public.claim_push_subscription() returns void language sql security definer set search_path = public, pg_temp as $$ select 1 $$;
    create function public.reorder_jobs(ordered_ids uuid[]) returns void language sql security definer set search_path = public, pg_temp as $$ select 1 $$;
  `;
  await writeFile(path.join(root, "supabase/schema.sql"), sql);
  await writeFile(path.join(root, "supabase/migrations/0000.sql"), sql);
  await writeFile(path.join(root, ".github/workflows/ci.yml"), "env:\n  E2E_REQUIRE_AUTH: \"true\"\n");
  await writeFile(path.join(root, "e2e/global-setup.ts"), "validateAuthE2ECredentials(process.env)");
  return root;
}

test("安全な契約を受理する", async () => assert.deepEqual(await checkSecurityContracts(await fixture()), []));
test("通常のVITE公開値は誤検知しない", async () => assert.deepEqual(await checkSecurityContracts(await fixture("const key = import.meta.env.VITE_SUPABASE_ANON_KEY")), []));
test("service roleのVITE公開を拒否する", async () => {
  const errors = await checkSecurityContracts(await fixture("const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(errors.some((error) => error.includes("VITE_*")));
});
test("SECURITY DEFINERのsearch_path漏れを拒否する", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "supabase/migrations/9999.sql"), "create function public.unsafe() returns void language sql security definer as $$ select 1 $$;");
  assert.ok((await checkSecurityContracts(root)).some((error) => error.includes("unsafe")));
});
test("合法な名前付きdollar quoteを解析する", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "supabase/migrations/9999.sql"), "create function public.tagged() returns void language sql security definer set search_path = public, pg_temp as $body$ select 1 $body$;");
  assert.equal((await checkSecurityContracts(root)).some((error) => error.includes("tagged")), false);
});
test("最終的なDISABLE RLSを拒否する", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "supabase/migrations/9999.sql"), "alter table public.jobs disable row level security;");
  assert.ok((await checkSecurityContracts(root)).some((error) => error.includes("最終RLS")));
});
test("policy削除後に再作成されない状態を拒否する", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "supabase/migrations/9999.sql"), 'drop policy if exists "own" on public.jobs;');
  assert.ok((await checkSecurityContracts(root)).some((error) => error.includes("policyが削除")));
});
test("authenticatedへのdelivery log権限再付与を拒否する", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "supabase/migrations/9999.sql"), "grant select on table public.interview_push_sent to authenticated;");
  assert.ok((await checkSecurityContracts(root)).some((error) => error.includes("直接権限")));
});
test("filesystem列挙順ではなくmigrationファイル名順で最終状態を判定する", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "supabase/migrations/9999_disable.sql"), "alter table public.jobs disable row level security;");
  await writeFile(path.join(root, "supabase/migrations/1000_enable.sql"), "alter table public.jobs enable row level security;");
  assert.ok((await checkSecurityContracts(root)).some((error) => error.includes("最終RLS")));
});
test("authenticated E2Eのrequire flag欠落を拒否する", async () => {
  const root = await fixture();
  await writeFile(path.join(root, ".github/workflows/ci.yml"), "name: CI\n");
  assert.ok((await checkSecurityContracts(root)).some((error) => error.includes("E2E_REQUIRE_AUTH")));
});
