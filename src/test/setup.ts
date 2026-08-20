import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => undefined;
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => undefined;
}
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => undefined;
}

// @testing-library/reactは`typeof afterEach === "function"`を見て自動cleanupを登録するが、
// このプロジェクトはvitestの`globals: true`を使っていないためグローバルにafterEachが存在せず、
// 自動cleanupが効かない（レンダリング結果がテスト間に残り続ける）。ここで明示的に登録する。
afterEach(() => {
  cleanup();
});
