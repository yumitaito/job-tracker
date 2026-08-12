import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// vite.config.tsをそのまま継承しつつ、テスト実行に必要な設定のみ追加する。
// 既存のdev/build設定（エイリアス・プラグイン等）に影響を与えないよう分離している。
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true,
      exclude: ["node_modules", "dist", "supabase/functions/**"],
    },
  }),
);
