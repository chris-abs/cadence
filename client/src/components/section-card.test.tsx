import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionCard } from "./section-card";

describe("SectionCard", () => {
  it("renders a section heading, the description and the content", () => {
    render(
      <SectionCard title="This week" description="Planned meals.">
        <p>content</p>
      </SectionCard>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "This week" })).toBeInTheDocument();
    expect(screen.getByText("Planned meals.")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
