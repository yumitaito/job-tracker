import { describe, expect, it } from "vitest";
import { applyJobOrder, reorderJobIds, toDisplayOrderUpdates } from "@/features/jobs/lib/job-order";
import type { Job } from "@/features/jobs/types/job";

function createTestJob(id: string, display_order: number): Job {
  return {
    id,
    user_id: "user-1",
    company_name: `Company ${id}`,
    position: "Engineer",
    employment_type: null,
    application_url: null,
    application_date: null,
    status: "not_applied",
    desire_level: "medium",
    first_interview_at: null,
    second_interview_at: null,
    final_interview_at: null,
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

describe("applyJobOrder", () => {
  it("orderedIds の順序どおりに Job 配列を並べ替える", () => {
    const jobs = [createTestJob("a", 0), createTestJob("b", 1), createTestJob("c", 2)];
    const result = applyJobOrder(jobs, ["c", "a", "b"]);
    expect(result.map((job) => job.id)).toEqual(["c", "a", "b"]);
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
