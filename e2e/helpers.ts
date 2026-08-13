import type { Locator, Page } from "@playwright/test";

/** 正規表現の特殊文字をエスケープする */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * `FormField`（`src/components/form/FormField.tsx`）/ `Field`（`JobForm.tsx`内）
 * コンポーネントは `<Label>` と入力欄を同じ親要素内の兄弟要素として描画しており、
 * `htmlFor`/`id` による明示的な関連付けがない（アクセシビリティ上の改善余地として別途報告）。
 * そのため `page.getByLabel()` では入力欄を特定できず、ラベル要素を起点に
 * 入力欄を辿るヘルパーを用意する。
 *
 * 対応範囲・前提:
 * - ラベルの一致は完全一致。ただし `required` バッジ（「必須」）が
 *   ラベルテキストの末尾に連結して描画される（例:「企業名必須」）ため、
 *   その有無は許容する。したがって「パスワード」は「パスワード確認」等の
 *   前方一致する別ラベルにはヒットしない。
 * - ラベルの直後の兄弟要素（`<input>`/`<textarea>`/`<select>` そのもの、
 *   または `JobForm.tsx`の応募先URL欄のように中間の`<div>`でラップされた
 *   子孫要素）から最初の `input`/`textarea`/`select` を探索する。
 *   ラベルの兄弟要素をさらに越えて（例: エラーメッセージの`<p>`以降）探索はしない。
 * - Radix UIの `Select`（`SelectTrigger`は`<button>`）など、
 *   ネイティブの`input`/`textarea`/`select`要素を使わないコンポーネントは対象外。
 */
export function fieldByLabel(scope: Page | Locator, label: string): Locator {
  const escaped = escapeRegExp(label);
  return scope
    .locator("label", { hasText: new RegExp(`^${escaped}(必須)?$`) })
    .locator(
      "xpath=following-sibling::*[1][self::input or self::textarea or self::select] | following-sibling::*[1]//input | following-sibling::*[1]//textarea | following-sibling::*[1]//select",
    )
    .first();
}
