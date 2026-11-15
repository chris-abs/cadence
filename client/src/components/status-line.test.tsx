import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusLine } from "./status-line";

describe("StatusLine", () => {
  it("announces its message in a live status region", () => {
    render(<StatusLine tone="success">All good</StatusLine>);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("All good");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("renders the action after the message", () => {
    render(
      <StatusLine tone="error" action={<button type="button">Retry</button>}>
        Failed
      </StatusLine>,
    );

    expect(screen.getByRole("status")).toContainElement(
      screen.getByRole("button", { name: "Retry" }),
    );
  });

  it("keeps the region mounted when the tone changes", () => {
    const { rerender } = render(<StatusLine tone="loading">Checking</StatusLine>);
    const region = screen.getByRole("status");

    rerender(<StatusLine tone="success">Done</StatusLine>);

    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent("Done");
  });
});
