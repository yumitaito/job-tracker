import { describe, expect, it } from "vitest";
import { fromDateTimeLocalInputValue, toDateTimeLocalInputValue } from "./datetime";

describe("toDateTimeLocalInputValue", () => {
  it("null/undefinedの場合は空文字を返す", () => {
    expect(toDateTimeLocalInputValue(null)).toBe("");
    expect(toDateTimeLocalInputValue(undefined)).toBe("");
  });

  it("空文字の場合は空文字を返す", () => {
    expect(toDateTimeLocalInputValue("")).toBe("");
  });

  it("不正な形式の文字列の場合は空文字を返す", () => {
    expect(toDateTimeLocalInputValue("not-a-date")).toBe("");
  });

  it("有効なISO文字列をローカルタイムゾーンのdatetime-local形式（分単位まで）に変換する", () => {
    const isoValue = "2026-08-07T09:30:00.000Z";
    const expected = formatAsLocal(new Date(isoValue));
    expect(toDateTimeLocalInputValue(isoValue)).toBe(expected);
  });

  it("秒・ミリ秒の情報は切り捨てられ、分単位までの精度になる", () => {
    const isoValue = "2026-08-07T09:30:45.123Z";
    const result = toDateTimeLocalInputValue(isoValue);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe("fromDateTimeLocalInputValue", () => {
  it("空文字の場合はundefinedを返す", () => {
    expect(fromDateTimeLocalInputValue("")).toBeUndefined();
  });

  it("不正な形式の文字列の場合はundefinedを返す", () => {
    expect(fromDateTimeLocalInputValue("not-a-date")).toBeUndefined();
  });

  it("有効なdatetime-local文字列をISO文字列(UTC)に変換する", () => {
    const localValue = "2026-08-07T18:30";
    const expectedDate = new Date(2026, 7, 7, 18, 30);
    expect(fromDateTimeLocalInputValue(localValue)).toBe(expectedDate.toISOString());
  });
});

describe("往復変換", () => {
  it("datetime-local → ISO → datetime-localで分単位まで情報が保持される", () => {
    const original = "2026-01-15T07:05";
    const iso = fromDateTimeLocalInputValue(original);
    expect(iso).toBeDefined();
    expect(toDateTimeLocalInputValue(iso)).toBe(original);
  });

  it("ISO → datetime-local → ISOで分単位まで情報が保持される（秒は0に丸められる）", () => {
    const originalIso = "2026-03-20T12:45:00.000Z";
    const localValue = toDateTimeLocalInputValue(originalIso);
    const roundTrippedIso = fromDateTimeLocalInputValue(localValue);
    expect(roundTrippedIso).toBe(originalIso);
  });
});

/** テスト実行環境のローカルタイムゾーンでDateをdatetime-local形式の文字列に整形するヘルパー */
function formatAsLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
