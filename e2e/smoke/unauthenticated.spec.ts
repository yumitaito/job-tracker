import { test, expect } from "@playwright/test";
import { fieldByLabel } from "../helpers";

// 未ログイン状態で完結するスモークテスト。Secrets（テスト用アカウント）は不要で、
// GitHub Actionsのようにフォークからのpull_requestでも常時実行できる。
test.describe("未ログイン状態のスモークテスト", () => {
  test("/login にアクセスするとログインフォームが表示される", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
    await expect(fieldByLabel(page, "メールアドレス")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("/signup にアクセスすると新規登録フォームが表示される", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: "アカウントを作成" })).toBeVisible();
    await expect(fieldByLabel(page, "表示名")).toBeVisible();
    await expect(fieldByLabel(page, "メールアドレス")).toBeVisible();

    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2); // パスワード・パスワード確認
    await expect(passwordInputs.nth(0)).toBeVisible();
    await expect(passwordInputs.nth(1)).toBeVisible();

    await expect(page.getByRole("button", { name: "アカウントを作成" })).toBeVisible();
  });

  for (const path of ["/jobs", "/jobs/new", "/settings"]) {
    test(`未ログイン状態で ${path} にアクセスすると /login にリダイレクトされる`, async ({
      page,
    }) => {
      await page.goto(path);

      await page.waitForURL("**/login", { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
    });
  }

  test("存在しないURLにアクセスすると404ページが表示される", async ({ page }) => {
    await page.goto("/no-such-page");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("ページが見つかりませんでした")).toBeVisible();
  });
});
