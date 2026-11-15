import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Page } from "./page";

describe("Page", () => {
  it("renders the title as the page heading, the description and the content", () => {
    render(
      <Page title="Recipes" description="Everything the family cooks.">
        <p>content</p>
      </Page>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Recipes" })).toBeInTheDocument();
    expect(screen.getByText("Everything the family cooks.")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
