import type { Locator, Page } from "@playwright/test";

/**
 * `FormField` / `Field` コンポーネントは `<Label>` と `<input>` を
 * 同じ親要素内の兄弟要素として描画しており、`htmlFor`/`id` による
 * 明示的な関連付けがない（アクセシビリティ上の改善余地として別途報告）。
 * そのため `page.getByLabel()` では入力欄を特定できず、
 * ラベルの次の兄弟要素として input を辿るヘルパーを用意する。
 */
export function fieldByLabel(scope: Page | Locator, label: string): Locator {
  return scope
    .locator("label", { hasText: label })
    .locator("xpath=following-sibling::input[1]");
}
