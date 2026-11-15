import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/** Presses the on-screen keypad keys for `digits`, one after another. */
export function pressKeys(digits: string): Promise<void> {
  return digits.split("").reduce(async (previous, digit) => {
    await previous;
    await userEvent.click(screen.getByRole("button", { name: digit }));
  }, Promise.resolve());
}
