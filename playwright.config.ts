import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// E2Eスモークテスト用のPlaywright設定。
// - テストは e2e/ 配下（src/配下ではない）に分離配置する。
// - devサーバー（`npm run dev`）をそのまま利用し、ビルドは行わない。
// - 対象ブラウザはChromiumのみ（最小限のスモークテストのため）。
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // ローカルで.envが未設定でもdevサーバーが起動できるよう、
      // CIのbuildジョブと同様にプレースホルダー値をフォールバックとして使う。
      // 未認証スモークテストはこの値のままでも成立する（実際のSupabase接続は行われないため）。
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key",
    },
  },
});

// authenticated.spec.ts で使用するstorageStateの保存先。
// global-setup.ts と揃える（Secrets未設定時はファイルが作成されないため、
// authenticated.spec.ts 側で存在チェックしてskipする）。
export const AUTH_STORAGE_STATE = path.resolve(import.meta.dirname, "e2e/.auth/user.json");
