import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CenteredLayout } from "./centered-layout";
import { ConfirmDialog } from "./confirm-dialog";
import { ErrorState, LoadingState } from "./page-states";
import { Button } from "./ui/button";

describe("CenteredLayout", () => {
  it("renders the main landmark with the page heading, content and footer", () => {
    render(
      <CenteredLayout title="Sign in" description="Welcome back." footer={<p>footer</p>}>
        <p>form</p>
      </CenteredLayout>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("form");
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Welcome back.")).toBeInTheDocument();
    expect(screen.getByText("footer")).toBeInTheDocument();
  });
});

describe("page states", () => {
  it("announces loading", () => {
    render(<LoadingState label="Loading profiles…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading profiles…");
  });

  it("announces an error and retries", async () => {
    const onRetry = vi.fn<() => void>();
    render(<ErrorState message="Could not load." onRetry={onRetry} />);

    expect(screen.getByRole("status")).toHaveTextContent("Could not load.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("ConfirmDialog", () => {
  it("asks before confirming, and cancelling does nothing", async () => {
    const onConfirm = vi.fn<() => void>();
    render(
      <ConfirmDialog
        trigger={<Button>Sign out</Button>}
        title="Sign out?"
        description="You will need the password."
        confirmLabel="Yes, sign out"
        tone="destructive"
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("alertdialog", { name: "Sign out?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, sign out" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
