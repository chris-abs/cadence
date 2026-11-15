import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Banner } from "./banner";

describe("Banner", () => {
  it("announces errors as alerts", () => {
    render(<Banner tone="error">Could not save</Banner>);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
  });

  it("shows other tones as polite status with a title", () => {
    render(
      <Banner tone="warning" title="Heads up">
        Details
      </Banner>,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Heads up");
    expect(status).toHaveAttribute("data-tone", "warning");
  });

  it("offers a dismiss button only when it can be dismissed", async () => {
    const onDismiss = vi.fn<() => void>();
    const { rerender } = render(<Banner tone="info">Hello</Banner>);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();

    rerender(
      <Banner tone="info" onDismiss={onDismiss}>
        Hello
      </Banner>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
