import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc },
}));

import { reorderJobs } from "@/features/jobs/api/jobs-api";

describe("reorderJobs", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("全IDをreorder_jobs RPCへ一度に渡す", async () => {
    rpc.mockResolvedValue({ error: null });

    await reorderJobs(["job-2", "job-1"]);

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("reorder_jobs", {
      ordered_ids: ["job-2", "job-1"],
    });
  });

  it("RPCエラーを呼び出し元へ伝える", async () => {
    rpc.mockResolvedValue({ error: { message: "並び順を保存できません" } });

    await expect(reorderJobs([])).rejects.toThrow("並び順を保存できません");
  });
});
