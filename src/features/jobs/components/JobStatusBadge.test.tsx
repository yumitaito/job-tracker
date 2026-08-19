import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobStatusBadge } from "./JobStatusBadge";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/features/jobs/types/job";

describe("JobStatusBadge", () => {
  it.each(JOB_STATUSES)("%sの場合は対応する日本語ラベルを表示する", (status) => {
    render(<JobStatusBadge status={status} />);
    expect(screen.getByText(JOB_STATUS_LABELS[status])).toBeInTheDocument();
  });

  it("9段階すべてのステータスにラベルが定義されている（網羅性の回帰確認）", () => {
    expect(JOB_STATUSES).toHaveLength(9);
    for (const status of JOB_STATUSES) {
      expect(JOB_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("内定の場合はグリーン系バッジを表示する", () => {
    render(<JobStatusBadge status="offer" />);
    const badge = screen.getByText("内定");
    expect(badge).toHaveClass("bg-[var(--status-offer-bg)]");
    expect(badge).toHaveClass("text-[var(--status-offer-fg)]");
  });
});
