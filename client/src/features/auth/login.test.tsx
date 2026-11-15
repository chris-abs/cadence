import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { identity } from "@/test/handlers";
import { MOCK_PASSWORD, mockApi, standardFamily } from "@/test/mock-api";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

async function signIn(email: string, password: string) {
  await userEvent.type(await screen.findByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("login", () => {
  it("sends a signed-out device to login, then to the picker on success", async () => {
    mockApi.reset({ profiles: standardFamily() });
    const { router } = renderApp("/");

    expect(
      await screen.findByRole("heading", { name: "Sign in to your family" }),
    ).toBeInTheDocument();
    await signIn("family@example.com", MOCK_PASSWORD);

    expect(
      await screen.findByRole("heading", { name: "Who's using Cadence?" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/picker");
    expect(screen.getByRole("button", { name: /Alex/ })).toBeInTheDocument();
    expect(mockApi.sessions.family).toBe(true);
  });

  it("says when the email and password do not match", async () => {
    mockApi.reset({ profiles: standardFamily() });
    renderApp("/login");

    await signIn("family@example.com", "wrong password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That email and password do not match.",
    );
    expect(mockApi.sessions.family).toBe(false);
  });

  it("validates fields before sending", async () => {
    renderApp("/login");

    await signIn("not-an-email", "x");

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("counts down a rate limit and allows a retry when it ends", async () => {
    server.use(identity.loginRateLimited(2));
    renderApp("/login");

    await signIn("family@example.com", MOCK_PASSWORD);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Too many attempts");
    expect(screen.getByRole("timer")).toHaveTextContent("0:02");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();

    await screen.findByText("0:01", {}, { timeout: 2000 });
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
      },
      { timeout: 2000 },
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("offers registration only while it is open", async () => {
    mockApi.reset({ registrationOpen: true });
    const first = renderApp("/login");
    expect(await screen.findByRole("link", { name: "Create a family" })).toBeInTheDocument();
    first.unmount();

    mockApi.reset({ profiles: standardFamily() });
    const { queryClient } = renderApp("/login");
    await screen.findByRole("heading", { name: "Sign in to your family" });
    await waitFor(() => {
      expect(queryClient.getQueryData(["auth", "registration"])).toEqual({ open: false });
    });
    expect(screen.queryByRole("link", { name: "Create a family" })).not.toBeInTheDocument();
  });
});
