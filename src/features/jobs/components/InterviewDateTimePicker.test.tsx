import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InterviewDateTimePicker } from "./InterviewDateTimePicker";

describe("InterviewDateTimePicker", () => {
  it("未入力時はプレースホルダーを表示する", () => {
    render(<InterviewDateTimePicker value="" onChange={() => undefined} />);

    expect(screen.getByRole("button", { name: /日付を選択/i })).toBeInTheDocument();
    expect(screen.getByText("時間を選択")).toBeInTheDocument();
  });

  it("保存済み日時を日付・時間に分解して表示する", () => {
    render(
      <InterviewDateTimePicker value="2026-08-21T14:00" onChange={() => undefined} />,
    );

    expect(screen.getByRole("button", { name: /2026\/08\/21/i })).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();
  });

  it("15分単位でない時刻も表示する", () => {
    render(
      <InterviewDateTimePicker value="2026-08-21T14:10" onChange={() => undefined} />,
    );

    expect(screen.getByText("14:10")).toBeInTheDocument();
  });

  it("外部から value が更新されると表示が同期される", () => {
    const { rerender } = render(
      <InterviewDateTimePicker value="2026-08-21T14:00" onChange={() => undefined} />,
    );

    expect(screen.getByRole("button", { name: /2026\/08\/21/i })).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();

    rerender(
      <InterviewDateTimePicker value="2026-08-25T16:00" onChange={() => undefined} />,
    );

    expect(screen.getByRole("button", { name: /2026\/08\/25/i })).toBeInTheDocument();
    expect(screen.getByText("16:00")).toBeInTheDocument();
  });

  it("inline variant では1ボタンに日時を表示する", () => {
    render(
      <InterviewDateTimePicker
        variant="inline"
        value="2026-08-21T14:00"
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("2026/08/21 14:00");
  });
});
