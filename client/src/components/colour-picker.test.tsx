import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColourPicker } from "./colour-picker";

describe("ColourPicker", () => {
  it("offers every profile colour as a named radio in one group", () => {
    render(
      <ColourPicker
        legend="Your colour"
        value="sky"
        onChange={vi.fn<(colour: string) => void>()}
      />,
    );

    const group = screen.getByRole("group", { name: "Your colour" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(22);
    expect(screen.getByRole("radio", { name: "Sky" })).toBeChecked();
  });

  it("reports the chosen colour", async () => {
    const onChange = vi.fn<(colour: string) => void>();
    render(<ColourPicker legend="Your colour" value={undefined} onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Rose" }));

    expect(onChange).toHaveBeenCalledWith("rose");
  });

  it("describes the group with its error", () => {
    render(
      <ColourPicker
        legend="Your colour"
        value={undefined}
        onChange={vi.fn<(colour: string) => void>()}
        error="Choose one."
      />,
    );

    expect(screen.getByRole("group")).toHaveAccessibleDescription("Choose one.");
  });
});
