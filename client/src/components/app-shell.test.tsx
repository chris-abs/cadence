import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

function renderShell(props: Omit<ComponentProps<typeof AppShell>, "children"> = {}) {
  // jsdom has no scrollTo; the router calls it on navigation.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell {...props}>
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

  it("places nav, header actions and notices", async () => {
    renderShell({
      nav: <a href="/settings">Settings</a>,
      actions: <button type="button">Switch profile</button>,
      notices: <p>Set a PIN</p>,
    });

    const nav = await screen.findByRole("navigation", { name: "Main" });
    expect(nav).toHaveTextContent("Settings");
    expect(screen.getByRole("banner")).toContainElement(
      screen.getByRole("button", { name: "Switch profile" }),
    );
    expect(screen.getByRole("main")).toHaveTextContent("Set a PIN");
  });
});
