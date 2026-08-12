import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobStatusBadge } from "./JobStatusBadge";

describe("JobStatusBadge", () => {
  it("not_appliedの場合は「未応募」と表示する", () => {
    render(<JobStatusBadge status="not_applied" />);
    expect(screen.getByText("未応募")).toBeInTheDocument();
  });

  it("appliedの場合は「応募済み」と表示する", () => {
    render(<JobStatusBadge status="applied" />);
    expect(screen.getByText("応募済み")).toBeInTheDocument();
  });
});
