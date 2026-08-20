import { describe, expect, it } from "vitest";
import { applyJobOrder, normalizeOrderedJobIds, pinOfferJobsToTop, reorderJobIds, toDisplayOrderUpdates } from "@/features/jobs/lib/job-order";
import type { Job } from "@/features/jobs/types/job";

function createTestJob(id: string, display_order: number, status: Job["status"] = "not_applied"): Job {
  return {
    id,
    user_id: "user-1",
    company_name: `Company ${id}`,
    position: "Engineer",
    employment_type: null,
    application_url: null,
    application_date: null,
    status,
    desire_level: "medium",
    casual_interview_at: null,
    first_interview_at: null,
    second_interview_at: null,
    final_interview_at: null,
    casual_interview_url: null,
    first_interview_url: null,
    second_interview_url: null,
    final_interview_url: null,
    interview_schedules: null,
    location: null,
    technologies: null,
    notes: null,
    min_salary: null,
    max_salary: null,
    display_order,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("reorderJobIds", () => {
  it("active と over から並び替え後の id 配列を返す", () => {
    const ids = ["a", "b", "c", "d"];
    expect(reorderJobIds(ids, "a", "c")).toEqual(["b", "c", "a", "d"]);
  });

  it("同じ位置の場合は null を返す", () => {
    const ids = ["a", "b", "c"];
    expect(reorderJobIds(ids, "b", "b")).toBeNull();
  });
});

describe("pinOfferJobsToTop", () => {
  it("内定求人を先頭へ移動し、それぞれのグループ内の順序は維持する", () => {
    const jobs = [
      createTestJob("a", 0),
      createTestJob("b", 1, "offer"),
      createTestJob("c", 2),
      createTestJob("d", 3, "offer"),
    ];

    expect(pinOfferJobsToTop(jobs).map((job) => job.id)).toEqual(["b", "d", "a", "c"]);
  });

  it("書類選考中は内定の次に配置する", () => {
    const jobs = [
      createTestJob("a", 0, "offer"),
      createTestJob("b", 1, "document_screening"),
      createTestJob("c", 2),
      createTestJob("d", 3, "document_screening"),
      createTestJob("e", 4, "offer"),
    ];

    expect(pinOfferJobsToTop(jobs).map((job) => job.id)).toEqual(["a", "e", "b", "d", "c"]);
  });
});

describe("normalizeOrderedJobIds", () => {
  it("内定求人の id を先頭へ正規化する", () => {
    const jobs = [
      createTestJob("a", 0),
      createTestJob("b", 1, "offer"),
      createTestJob("c", 2),
    ];

    expect(normalizeOrderedJobIds(jobs, ["c", "a", "b"])).toEqual(["b", "c", "a"]);
  });

  it("書類選考中は内定の次に正規化する", () => {
    const jobs = [
      createTestJob("a", 0, "offer"),
      createTestJob("b", 1, "document_screening"),
      createTestJob("c", 2),
    ];

    expect(normalizeOrderedJobIds(jobs, ["a", "c", "b"])).toEqual(["a", "b", "c"]);
  });
});

describe("applyJobOrder", () => {
  it("orderedIds の順序どおりに Job 配列を並べ替える", () => {
    const jobs = [createTestJob("a", 0), createTestJob("b", 1), createTestJob("c", 2)];
    const result = applyJobOrder(jobs, ["c", "a", "b"]);
    expect(result.map((job) => job.id)).toEqual(["c", "a", "b"]);
  });

  it("内定と書類選考中は並び替え後も内定→書類選考中の順で先頭に来る", () => {
    const jobs = [
      createTestJob("a", 0, "offer"),
      createTestJob("b", 1, "document_screening"),
      createTestJob("c", 2),
    ];
    const result = applyJobOrder(jobs, ["c", "a", "b"]);
    expect(result.map((job) => job.id)).toEqual(["a", "b", "c"]);
  });
});

describe("toDisplayOrderUpdates", () => {
  it("0 から連番の display_order 更新ペイロードを生成する", () => {
    expect(toDisplayOrderUpdates(["x", "y", "z"])).toEqual([
      { id: "x", display_order: 0 },
      { id: "y", display_order: 1 },
      { id: "z", display_order: 2 },
    ]);
  });
});
