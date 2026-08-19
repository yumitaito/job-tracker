import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { AUTH_STORAGE_STATE } from "../../playwright.config";
import { fieldByLabel } from "../helpers";

// ログイン済み状態のスモークテスト。
// E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD が設定されていない環境（Secrets未設定のCIやローカル）
// では global-setup.ts がstorageStateを生成しないため、ファイルの有無で丸ごとskipする。
// これによりSecrets未設定でもCIは失敗しない。
const hasAuthState = fs.existsSync(AUTH_STORAGE_STATE);

test.describe("ログイン済み状態のスモークテスト", () => {
  test.skip(
    !hasAuthState,
    "E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD が未設定のためスキップします（e2e/global-setup.ts を参照）",
  );

  test.use({ storageState: hasAuthState ? AUTH_STORAGE_STATE : undefined });

  test("/jobs にアクセスすると無限ローディングにならず一覧またはEmpty Stateが表示される", async ({
    page,
  }) => {
    await page.goto("/jobs");

    const emptyState = page.getByText("求人がまだ登録されていません");
    const jobsTableHeader = page.getByText("企業名 / 職種");

    // 一覧（テーブル/カード）かEmpty Stateのどちらかが一定時間内に表示されればよい。
    // データ0件でも問題ないよう「Empty State」も正常系として許容する。
    await expect(emptyState.or(jobsTableHeader)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("データの取得に失敗しました")).not.toBeVisible();
  });

  test("/settings にアクセスするとローディングが一定時間内に消え、通知設定を含む各セクションが表示される", async ({
    page,
  }) => {
    // NOTE: PlaywrightのstorageStateはService Worker登録状態を保存しないため、
    // このテストは毎回「Service Worker未登録の状態」からページを開くことになる。
    // これは、設定画面がPush通知のService Worker登録待ちで無限ローディングになっていた
    // バグ（面接リマインダー通知セクションが読み込み中のまま止まる不具合）の
    // 回帰を検出するためのテストであり、意図的な前提条件である。
    await page.goto("/settings");

    const loadingText = page.getByText("通知設定を読み込み中...");
    // 一定時間内にローディング表示が消えることを明示的にアサートする（15秒以内）。
    // ここがタイムアウトする場合は、Push通知設定の無限ローディングが再発している可能性が高い。
    await expect(loadingText).toBeHidden({ timeout: 15_000 });

    await expect(page.getByRole("heading", { name: "面接リマインダー通知" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "アカウント情報" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "セキュリティ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "アカウント", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "アカウントを削除" })).toBeVisible();
  });

  test("/jobs/new にアクセスすると求人登録フォームの主要項目が表示される（送信はしない）", async ({
    page,
  }) => {
    await page.goto("/jobs/new");

    await expect(page.getByRole("heading", { name: "求人を登録" })).toBeVisible();
    await expect(fieldByLabel(page, "企業名")).toBeVisible();
    await expect(fieldByLabel(page, "職種")).toBeVisible();
    await expect(page.getByRole("button", { name: "登録する" })).toBeVisible();

    // このテストではフォームの送信・データ作成は行わない。
  });
});
