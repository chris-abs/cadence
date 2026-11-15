import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { describe, expect, it, vi } from "vitest";
import type * as ButtonModule from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { PinPad } from "./pin-pad";

// Count renders of every Button (the keypad keys) without changing what they draw.
vi.mock("@/components/ui/button", async (importOriginal) => {
  const original = await importOriginal<typeof ButtonModule>();
  return { ...original, Button: vi.fn<typeof original.Button>(original.Button) };
});

function pressDigits(digits: string) {
  return digits.split("").reduce(async (previous, digit) => {
    await previous;
    await userEvent.click(screen.getByRole("button", { name: digit }));
  }, Promise.resolve());
}

const filledDots = (container: HTMLElement) =>
  container.querySelectorAll("[aria-hidden].bg-primary").length;

describe("PinPad", () => {
  it("completes with six keypad digits and clears itself", async () => {
    const onComplete = vi.fn<(pin: string) => void>();
    const { container } = render(<PinPad label="PIN for Alex" onComplete={onComplete} />);

    await pressDigits("12345");
    expect(filledDots(container)).toBe(5);
    expect(onComplete).not.toHaveBeenCalled();

    await pressDigits("6");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("123456");
    expect(filledDots(container)).toBe(0);
    expect(screen.getByLabelText("PIN for Alex")).toHaveValue("");
  });

  it("deletes the last digit", async () => {
    const onComplete = vi.fn<(pin: string) => void>();
    const { container } = render(<PinPad label="PIN" onComplete={onComplete} />);

    await pressDigits("12");
    await userEvent.click(screen.getByRole("button", { name: "Delete last digit" }));

    expect(filledDots(container)).toBe(1);
  });

  it("accepts a physical keyboard in the labelled input, digits only", async () => {
    const onComplete = vi.fn<(pin: string) => void>();
    render(<PinPad label="PIN for Alex" onComplete={onComplete} />);

    const input = screen.getByLabelText("PIN for Alex");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.type(input, "12a3456");

    expect(onComplete).toHaveBeenCalledExactlyOnceWith("123456");
  });

  it("takes keyboard digits while a keypad key has focus", async () => {
    const onComplete = vi.fn<(pin: string) => void>();
    render(<PinPad label="PIN" onComplete={onComplete} />);

    screen.getByRole("button", { name: "5" }).focus();
    await userEvent.keyboard("987654");

    expect(onComplete).toHaveBeenCalledExactlyOnceWith("987654");
  });

  it("ignores input while disabled", () => {
    const onComplete = vi.fn<(pin: string) => void>();
    render(<PinPad label="PIN" onComplete={onComplete} disabled />);

    for (const key of screen.getAllByRole("button")) expect(key).toBeDisabled();
    expect(screen.getByLabelText("PIN")).toBeDisabled();
  });

  it("marks the input invalid and links its message", () => {
    render(
      <>
        <p id="message">Wrong PIN</p>
        <PinPad
          label="PIN"
          onComplete={vi.fn<(pin: string) => void>()}
          invalid
          describedBy="message"
        />
      </>,
    );

    const input = screen.getByLabelText("PIN");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Wrong PIN");
  });

  it("re-renders only the dots on a digit press, not the keys or the pad", async () => {
    const padCommits = vi.fn<ProfilerOnRenderCallback>();
    render(
      <Profiler id="pad" onRender={padCommits}>
        <PinPad label="PIN" onComplete={vi.fn<(pin: string) => void>()} />
      </Profiler>,
    );
    const keyRenders = vi.mocked(Button).mock.calls.length;
    const commits = padCommits.mock.calls.length;

    await pressDigits("1");

    // One commit (the dots); no key re-rendered.
    expect(padCommits.mock.calls.length - commits).toBe(1);
    expect(vi.mocked(Button).mock.calls.length).toBe(keyRenders);
  });
});
