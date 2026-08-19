import { describe, expect, it } from "vitest";
import {
  buildTimeSelectOptions,
  combineDateTimeLocalParts,
  formatDateDisplay,
  splitDateTimeLocalValue,
  splitIsoToLocalParts,
  toDateTimeLocalInputValue,
} from "./datetime";

describe("splitDateTimeLocalValue", () => {
  it("空文字の場合は日付・時間とも空を返す", () => {
    expect(splitDateTimeLocalValue("")).toEqual({ date: "", time: "" });
  });

  it("datetime-local 形式を日付・時間に分割する", () => {
    expect(splitDateTimeLocalValue("2026-08-21T14:00")).toEqual({
      date: "2026-08-21",
      time: "14:00",
    });
  });

  it("15分単位でない時刻も保持する", () => {
    expect(splitDateTimeLocalValue("2026-08-21T14:10")).toEqual({
      date: "2026-08-21",
      time: "14:10",
    });
  });
});

describe("splitIsoToLocalParts", () => {
  it("ISO文字列をローカル日付・時間に分解する", () => {
    const iso = "2026-08-07T09:30:00.000Z";
    const local = toDateTimeLocalInputValue(iso);
    expect(splitIsoToLocalParts(iso)).toEqual(splitDateTimeLocalValue(local));
  });
});

describe("formatDateDisplay", () => {
  it("YYYY-MM-DD を 2026/08/21 形式で表示する", () => {
    expect(formatDateDisplay("2026-08-21")).toBe("2026/08/21");
  });
});

describe("combineDateTimeLocalParts", () => {
  it("日付と時間を datetime-local 形式に結合する", () => {
    expect(combineDateTimeLocalParts("2026-08-21", "14:00")).toBe("2026-08-21T14:00");
  });

  it("日付または時間が欠けている場合は空文字を返す", () => {
    expect(combineDateTimeLocalParts("2026-08-21", "")).toBe("");
    expect(combineDateTimeLocalParts("", "14:00")).toBe("");
  });
});

describe("buildTimeSelectOptions", () => {
  it("15分刻みの選択肢を生成する", () => {
    const options = buildTimeSelectOptions();
    expect(options).toContain("09:00");
    expect(options).toContain("09:15");
    expect(options).toContain("09:30");
    expect(options).toContain("09:45");
  });

  it("既存の非15分値を選択肢に含める", () => {
    const options = buildTimeSelectOptions("14:10");
    expect(options).toContain("14:10");
    expect(options).toContain("14:15");
  });
});

describe("保存 → 分解 → 結合の往復", () => {
  it("ケース8: 日時が変化しない", () => {
    const original = "2026-08-21T14:10";
    const { date, time } = splitDateTimeLocalValue(original);
    expect(combineDateTimeLocalParts(date, time)).toBe(original);
  });

  it("ケース6: DB保存済みISOが正しく分解される", () => {
    const iso = "2026-08-21T05:00:00.000Z";
    const parts = splitIsoToLocalParts(iso);
    expect(parts.date).toBeTruthy();
    expect(parts.time).toBeTruthy();
    expect(combineDateTimeLocalParts(parts.date, parts.time)).toBe(toDateTimeLocalInputValue(iso));
  });
});
