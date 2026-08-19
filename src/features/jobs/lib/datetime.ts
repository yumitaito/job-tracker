export type DateTimeLocalParts = {
  date: string;
  time: string;
};

/** 今日の日付を `<input type="date">` 用の値（YYYY-MM-DD）で返す */
export function getTodayDateInputValue(date: Date = new Date()): string {
  return formatLocalDateString(date);
}

/** Date を YYYY-MM-DD（ローカル日付）に整形する */
export function formatLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM-DD 文字列をローカル日付の Date に変換する（時刻は 00:00） */
export function parseLocalDateString(date: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

/** datetime-local 形式（YYYY-MM-DDTHH:mm）を日付・時間に分割する */
export function splitDateTimeLocalValue(value: string | null | undefined): DateTimeLocalParts {
  if (!value?.trim()) {
    return { date: "", time: "" };
  }

  const [datePart, timePart] = value.trim().split("T");
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return { date: "", time: "" };
  }

  const time = timePart?.slice(0, 5) ?? "";
  if (time && !/^\d{2}:\d{2}$/.test(time)) {
    return { date: datePart, time: "" };
  }

  return { date: datePart, time };
}

/** ISO または datetime-local 値をローカル日付・時間に分割する */
export function splitIsoToLocalParts(value: string | null | undefined): DateTimeLocalParts {
  if (!value?.trim()) {
    return { date: "", time: "" };
  }
  return splitDateTimeLocalValue(toDateTimeLocalInputValue(value));
}

/** YYYY-MM-DD を 2026/08/21 形式で表示する */
export function formatDateDisplay(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const [year, month, day] = date.split("-");
  return `${year}/${month}/${day}`;
}

/** 日付・時間を datetime-local 形式に結合する（どちらか欠けていれば空文字） */
export function combineDateTimeLocalParts(date: string, time: string): string {
  const normalizedDate = date.trim();
  const normalizedTime = time.trim();
  if (!normalizedDate || !normalizedTime) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return "";
  if (!/^\d{2}:\d{2}$/.test(normalizedTime)) return "";
  return `${normalizedDate}T${normalizedTime}`;
}

/** 時間 Select 用の選択肢（15分刻み + 既存の非15分値を保持） */
export function buildTimeSelectOptions(currentTime?: string): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  if (currentTime && /^\d{2}:\d{2}$/.test(currentTime) && !options.includes(currentTime)) {
    options.push(currentTime);
    options.sort();
  }

  return options;
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
