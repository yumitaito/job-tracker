import { describe, expect, it } from "vitest";
import { POPOVER_CONTENT_PLACEMENT_PROPS } from "./popover";

describe("POPOVER_CONTENT_PLACEMENT_PROPS", () => {
  it("viewport内に収めるためのデフォルト配置を定義する", () => {
    expect(POPOVER_CONTENT_PLACEMENT_PROPS).toEqual({
      align: "start",
      side: "bottom",
      sideOffset: 8,
      avoidCollisions: true,
      collisionPadding: 16,
      sticky: "partial",
    });
  });
});
