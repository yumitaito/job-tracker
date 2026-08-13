import { chromium, type FullConfig } from "@playwright/test";
import { AUTH_STORAGE_STATE } from "../playwright.config";

/**
 * E2Eテスト用のグローバルセットアップ。
 *
 * `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` が設定されている場合のみ、
 * 実際に /login フォームからUI経由でログインし、認証済みセッション（storageState）を
 * e2e/.auth/user.json に保存する。
 *
 * 未設定の場合は何もせず終了する。この場合、authenticated.spec.ts 側で
 * storageStateファイルが存在しないことを検知し test.skip() する（CIを失敗させない）。
 *
 * 新規テストアカウントで実データ（求人など）は一切作成しない。
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    console.log(
      "[global-setup] E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD が未設定のため、認証ありのE2Eテストはスキップされます。",
    );
    return;
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:5173";

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/login`);
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByLabel("パスワード").fill(password);
    await page.getByRole("button", { name: "ログイン" }).click();

    // ログイン成功後は /jobs へリダイレクトされる
    await page.waitForURL(`${baseURL}/jobs`, { timeout: 15_000 });

    await page.context().storageState({ path: AUTH_STORAGE_STATE });
  } finally {
    await browser.close();
  }
}
