/** 今日の日付を `<input type="date">` 用の値（YYYY-MM-DD）で返す */
export function getTodayDateInputValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** DBのtimestamptz値（ISO文字列）を<input type="datetime-local">用の値に変換する。ブラウザのローカルタイムゾーンで表示する。 */
export function toDateTimeLocalInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** <input type="datetime-local">の値（ローカルタイムゾーン、秒なし）をDB保存用のISO文字列(UTC)に変換する。不正な値の場合はundefinedを返す。 */
export function fromDateTimeLocalInputValue(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
