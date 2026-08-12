import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatSalary } from "./format";

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
