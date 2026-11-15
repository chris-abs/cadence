import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

function renderShell() {
  // jsdom has no scrollTo; the router calls it on navigation.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <p>page content</p>
      </AppShell>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("AppShell", () => {
  it("renders a header with a home link and the content in main", async () => {
    renderShell();

    expect(await screen.findByRole("link", { name: "Cadence" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("page content");
  });
});
