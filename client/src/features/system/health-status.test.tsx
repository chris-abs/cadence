import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { health } from "@/test/handlers";
import { renderWithQuery } from "@/test/render";
import { server } from "@/test/server";
import { HealthStatus } from "./health-status";

describe("HealthStatus", () => {
  it("shows checking, then online when the API is healthy", async () => {
    renderWithQuery(<HealthStatus />);

    expect(screen.getByRole("status")).toHaveTextContent("Checking API");
    expect(await screen.findByText("API online")).toBeInTheDocument();
  });

  it("shows unreachable when the request fails", async () => {
    server.use(health.networkError());
    renderWithQuery(<HealthStatus />);

    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
  });

  it("shows unreachable when the API reports an error", async () => {
    server.use(health.databaseDown());
    renderWithQuery(<HealthStatus />);

    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
  });

  it("goes online after a successful retry", async () => {
    server.use(health.networkError());
    renderWithQuery(<HealthStatus />);
    const retry = await screen.findByRole("button", { name: "Retry" });

    server.resetHandlers();
    await userEvent.click(retry);

    expect(await screen.findByText("API online")).toBeInTheDocument();
  });
});
