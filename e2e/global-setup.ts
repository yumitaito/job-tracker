import { chromium, type FullConfig } from "@playwright/test";
import { AUTH_STORAGE_STATE } from "../playwright.config";
import { fieldByLabel } from "./helpers";
import { validateAuthE2ECredentials } from "./auth-requirements";

/**
 * E2Eテスト用のグローバルセットアップ。
 *
 * `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` が設定されている場合のみ、
 * 実際に /login フォームからUI経由でログインし、認証済みセッション（storageState）を
 * e2e/.auth/user.json に保存する。
 *
 * ローカル任意モードでは未設定時にskipできる。品質ゲートではE2E_REQUIRE_AUTH=trueにより
 * 資格情報不足・ログイン失敗・storageState生成失敗を必ずテスト失敗にする。
 *
 * 新規テストアカウントで実データ（求人など）は一切作成しない。
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const { email, password } = validateAuthE2ECredentials(process.env);

  if (!email || !password) {
    console.log(
      "[global-setup] ローカル任意モード: 認証情報未設定のため認証ありE2Eをスキップします。",
    );
    return;
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:5173";

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/login`);
    await fieldByLabel(page, "メールアドレス").fill(email);
    await fieldByLabel(page, "パスワード").fill(password);
    await page.getByRole("button", { name: "ログイン" }).click();

    // ログイン成功後は /jobs へリダイレクトされる
    await page.waitForURL(`${baseURL}/jobs`, { timeout: 15_000 });

    await page.context().storageState({ path: AUTH_STORAGE_STATE });
  } finally {
    await browser.close();
  }
}
