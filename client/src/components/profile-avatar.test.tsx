import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileAvatar } from "./profile-avatar";

describe("ProfileAvatar", () => {
  it("shows initials on the profile colour, hidden from screen readers", () => {
    const { container } = render(<ProfileAvatar name="Mary Ann Lee" colour="sky" />);

    const avatar = container.firstElementChild;
    expect(avatar).toHaveTextContent("ML");
    expect(avatar).toHaveAttribute("aria-hidden");
    expect(avatar).toHaveAttribute("data-colour", "sky");
    expect(avatar).toHaveClass("bg-sky-200");
  });

  it("uses one initial for a one-word name", () => {
    const { container } = render(<ProfileAvatar name=" jo " colour="amber" />);

    expect(container).toHaveTextContent(/^J$/);
  });

  it("adds a lock badge when locked", () => {
    const { container } = render(<ProfileAvatar name="Alex" colour="lime" locked />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
