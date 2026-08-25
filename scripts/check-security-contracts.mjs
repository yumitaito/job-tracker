import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRONTEND_DIRS = ["src", "public"];

async function filesUnder(root, relative) {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const child = path.join(relative, entry.name);
    return entry.isDirectory() ? filesUnder(root, child) : [child];
  }))).flat();
}

function securityDefinerFunctions(sql) {
  const matches = [];
  const pattern = /create\s+(?:or\s+replace\s+)?function\s+([^\s(]+)[\s\S]*?security\s+definer[\s\S]*?(\$[a-zA-Z0-9_]*\$)[\s\S]*?\2\s*;/gi;
  for (const match of sql.matchAll(pattern)) matches.push({ name: match[1], definition: match[0] });
  return matches;
}

export async function checkSecurityContracts(root = ROOT) {
  const errors = [];
  const frontendFiles = (await Promise.all(FRONTEND_DIRS.map((dir) => filesUnder(root, dir)))).flat();
  for (const relative of frontendFiles) {
    const content = await readFile(path.join(root, relative), "utf8");
    if (/VITE_[A-Z0-9_]*(?:SERVICE_ROLE|PRIVATE_KEY)/i.test(content)) {
      errors.push(`${relative}: service role/private keyをVITE_*へ公開できません`);
    }
    if (/SUPABASE_SERVICE_ROLE_KEY|VAPID_PRIVATE_KEY/.test(content)) {
      errors.push(`${relative}: Edge専用Secretをフロントエンドへ置けません`);
    }
  }

  const schema = await readFile(path.join(root, "supabase/schema.sql"), "utf8");
  const migrationFiles = (await filesUnder(root, "supabase/migrations"))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
  const migrations = (await Promise.all(migrationFiles.map((file) => readFile(path.join(root, file), "utf8")))).join("\n");
  const combined = `${schema}\n${migrations}`;

  const workflow = await readFile(path.join(root, ".github/workflows/ci.yml"), "utf8");
  const globalSetup = await readFile(path.join(root, "e2e/global-setup.ts"), "utf8");
  if (!/E2E_REQUIRE_AUTH:\s*["']?true["']?/i.test(workflow)) {
    errors.push("Backend authenticated E2EにはE2E_REQUIRE_AUTH=trueが必要です");
  }
  if (!/validateAuthE2ECredentials\(process\.env\)/.test(globalSetup)) {
    errors.push("authenticated E2E global setupは資格情報をfail-closed検証する必要があります");
  }

  for (const { name, definition } of securityDefinerFunctions(combined)) {
    if (!/set\s+search_path\s*=\s*public\s*,\s*pg_temp/i.test(definition)) {
      errors.push(`${name}: SECURITY DEFINERには固定search_pathが必要です`);
    }
  }

  for (const table of ["jobs", "push_subscriptions", "interview_push_sent"]) {
    const rls = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i");
    if (!rls.test(schema) || !rls.test(migrations)) errors.push(`${table}: schemaとmigrationの双方でRLSを有効化してください`);
    const statePattern = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+(enable|disable)\\s+row\\s+level\\s+security`, "gi");
    const states = [...combined.matchAll(statePattern)];
    if (states.at(-1)?.[1].toLowerCase() !== "enable") errors.push(`${table}: 最終RLS状態がENABLEではありません`);
    if (table !== "interview_push_sent") {
      const policy = new RegExp(`create\\s+policy[\\s\\S]{0,200}on\\s+public\\.${table}`, "i");
      if (!policy.test(schema) || !policy.test(migrations)) errors.push(`${table}: schemaとmigrationの双方にpolicyが必要です`);
      const policyOperations = [...combined.matchAll(new RegExp(`(create|drop)\\s+policy[\\s\\S]{0,200}?on\\s+public\\.${table}`, "gi"))];
      if (policyOperations.at(-1)?.[1].toLowerCase() === "drop") errors.push(`${table}: policyが削除後に再作成されていません`);
    }
  }
  const normalized = combined.toLowerCase();
  const deliveryGrant = normalized.lastIndexOf("interview_push_sent to authenticated");
  const deliveryRevoke = normalized.lastIndexOf("interview_push_sent from authenticated");
  if (deliveryGrant > deliveryRevoke) {
    errors.push("interview_push_sent: authenticatedへの直接権限を付与できません");
  }

  const contracts = [
    ["claim_push_subscription", /unique\s*\(\s*endpoint\s*\)/i],
    ["reorder_jobs", /create\s+(?:or\s+replace\s+)?function\s+public\.reorder_jobs/i],
    ["interview_schedules", /interview_schedules\s+jsonb/i],
  ];
  for (const [name, pattern] of contracts) {
    if (!pattern.test(schema) || !pattern.test(migrations)) errors.push(`${name}: schemaとmigrationの重要契約が一致していません`);
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = await checkSecurityContracts();
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Security contracts: OK");
  }
}
