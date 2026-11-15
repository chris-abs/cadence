import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormField, TextField } from "./form-field";

describe("TextField", () => {
  it("labels the input and describes it with help text", () => {
    render(<TextField label="Email" description="Used to sign in." type="email" />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAccessibleDescription("Used to sign in.");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the input invalid and reads the error with it", () => {
    render(<TextField label="Email" description="Used to sign in." error="Enter an email." />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Used to sign in. Enter an email.");
  });

  it("passes input props through", async () => {
    render(<TextField label="Name" name="name" defaultValue="Jo" />);

    const input = screen.getByLabelText("Name");
    await userEvent.type(input, "e");
    expect(input).toHaveValue("Joe");
    expect(input).toHaveAttribute("name", "name");
  });
});

describe("FormField", () => {
  it("wires a custom control to its label and error", () => {
    render(
      <FormField label="Role" error="Choose a role.">
        {(control) => (
          <select {...control}>
            <option>Parent</option>
          </select>
        )}
      </FormField>,
    );

    const select = screen.getByLabelText("Role");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Choose a role.");
  });
});
