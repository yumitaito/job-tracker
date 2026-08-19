import { describe, expect, it } from "vitest";
import {
  getInterviewDateTimeClassName,
  getJobListSurfaceClassName,
  getJobStatusSelectClassName,
  isJobListEndedStatus,
} from "./job-list-styles";

describe("job-list-styles", () => {
  describe("getJobListSurfaceClassName", () => {
    it("不採用・辞退のみカード全体を薄いグレーにする", () => {
      expect(getJobListSurfaceClassName("rejected")).toContain("bg-muted/40");
      expect(getJobListSurfaceClassName("withdrawn")).toContain("bg-muted/40");
    });

    it("選考中・内定は通常表示のまま", () => {
      expect(getJobListSurfaceClassName("first_interview")).toBe("");
      expect(getJobListSurfaceClassName("offer")).toBe("");
    });
  });

  describe("isJobListEndedStatus", () => {
    it("不採用と辞退のみ終了扱い", () => {
      expect(isJobListEndedStatus("rejected")).toBe(true);
      expect(isJobListEndedStatus("withdrawn")).toBe(true);
      expect(isJobListEndedStatus("first_interview")).toBe(false);
    });
  });

  describe("getJobStatusSelectClassName", () => {
    it("内定のみグリーン系スタイルを返す", () => {
      expect(getJobStatusSelectClassName("offer")).toContain("bg-green-100");
      expect(getJobStatusSelectClassName("offer")).toContain("text-green-800");
      expect(getJobStatusSelectClassName("first_interview")).toBe("bg-white");
    });
  });

  describe("getInterviewDateTimeClassName", () => {
    it("終了した面接日時は背景付きのグレー表示にする", () => {
      const now = new Date(2026, 7, 16, 15, 0);
      const interviewAt = new Date(2026, 7, 16, 10, 0).toISOString();
      const className = getInterviewDateTimeClassName(interviewAt, now);

      expect(className).toContain("bg-muted/80");
      expect(className).toContain("text-neutral-600");
      expect(className).toContain("border-neutral-300");
    });

    it("当日のこれからの面接は強調表示にする", () => {
      const now = new Date(2026, 7, 16, 15, 0);
      const interviewAt = new Date(2026, 7, 16, 18, 0).toISOString();

      expect(getInterviewDateTimeClassName(interviewAt, now)).toContain("text-destructive");
    });
  });
});
