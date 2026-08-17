import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatSalary, isToday } from "./format";

describe("formatDate", () => {
  it("null/undefinedの場合はハイフンを返す", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });

  it("不正な日付文字列の場合はハイフンを返す", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });

  it("正しい日付をYYYY/MM/DD形式で返す", () => {
    expect(formatDate("2026-08-07")).toBe("2026/08/07");
  });
});

describe("formatDateTime", () => {
  it("null/undefinedの場合はハイフンを返す", () => {
    expect(formatDateTime(null)).toBe("-");
  });

  it("日時を含む文字列を整形して返す", () => {
    const result = formatDateTime("2026-08-07T09:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).not.toBe("-");
  });
});

describe("isToday", () => {
  it("null/undefined/不正な日付の場合はfalseを返す", () => {
    expect(isToday(null)).toBe(false);
    expect(isToday(undefined)).toBe(false);
    expect(isToday("not-a-date")).toBe(false);
  });

  it("今日の日付ならtrueを返す", () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0);
    expect(isToday(today.toISOString())).toBe(true);
  });

  it("今日以外の日付ならfalseを返す", () => {
    expect(isToday("2020-01-01T09:00:00.000Z")).toBe(false);
  });

  it("比較基準のnowを渡した場合はその日付で判定する", () => {
    const now = new Date(2026, 7, 16, 15, 0);

    expect(isToday(new Date(2026, 7, 16, 9, 0).toISOString(), now)).toBe(true);
    expect(isToday(new Date(2026, 7, 16, 23, 59).toISOString(), now)).toBe(true);
    expect(isToday(new Date(2026, 7, 15, 23, 59).toISOString(), now)).toBe(false);
    expect(isToday(new Date(2026, 7, 17, 0, 0).toISOString(), now)).toBe(false);
  });
});

describe("formatSalary", () => {
  it("null/undefinedの場合はハイフンを返す", () => {
    expect(formatSalary(null)).toBe("-");
    expect(formatSalary(undefined)).toBe("-");
  });

  it("0の場合はハイフンにならず0万円を返す", () => {
    expect(formatSalary(0)).toBe("0万円");
  });

  it("金額を万円単位のカンマ区切りで返す", () => {
    expect(formatSalary(800)).toBe("800万円");
    expect(formatSalary(1200)).toBe("1,200万円");
  });
});
