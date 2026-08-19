import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteJobDialog } from "./DeleteJobDialog";

describe("DeleteJobDialog", () => {
  it("削除と辞退の違いが分かる説明文を表示する", () => {
    render(
      <DeleteJobDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={false}
        companyName="テスト株式会社"
      />,
    );

    expect(screen.getByText("この求人を削除しますか？")).toBeInTheDocument();
    expect(
      screen.getByText(/削除すると、元に戻すことはできません。/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/選考を辞退した場合は、ステータスを「辞退」に変更してください。/),
    ).toBeInTheDocument();
  });
});
