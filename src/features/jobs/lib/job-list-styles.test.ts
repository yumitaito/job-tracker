import { describe, expect, it } from "vitest";
import { getInterviewDateTimeClassName } from "./job-list-styles";

describe("getInterviewDateTimeClassName", () => {
  it("終了した面接日時は muted 表示にする", () => {
    const now = new Date(2026, 7, 16, 15, 0);
    const interviewAt = new Date(2026, 7, 16, 10, 0).toISOString();

    expect(getInterviewDateTimeClassName(interviewAt, now)).toContain("text-muted-foreground");
  });

  it("当日のこれからの面接は強調表示にする", () => {
    const now = new Date(2026, 7, 16, 15, 0);
    const interviewAt = new Date(2026, 7, 16, 18, 0).toISOString();

    expect(getInterviewDateTimeClassName(interviewAt, now)).toContain("text-destructive");
  });
});
