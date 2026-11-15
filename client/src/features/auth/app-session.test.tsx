import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pressKeys } from "@/test/actions";
import { identity } from "@/test/handlers";
import { mockApi, mockProfile, standardFamily } from "@/test/mock-api";
import { recordRequests, renderApp } from "@/test/render-app";
import { server } from "@/test/server";

function signedInAs(name: string, autoLockMinutes = 10) {
  mockApi.reset({
    profiles: standardFamily(),
    signedIn: true,
    activeProfile: name,
    autoLockMinutes,
  });
}

/** From the app: lock to the picker, then open `name` (with `pin` if it has one). */
async function switchTo(name: string, pin?: string) {
  await userEvent.click(await screen.findByRole("button", { name: "Switch profile" }));
  await userEvent.click(await screen.findByRole("button", { name: new RegExp(`^${name}`) }));
  if (pin) {
    await screen.findByLabelText(`PIN for ${name}`);
    await pressKeys(pin);
  }
  await screen.findByRole("heading", { name: `Hello, ${name}` });
}

describe("app shell", () => {
  it("shows the active profile with switch and sign-out actions", async () => {
    signedInAs("Jo");
    renderApp("/");

    const header = await screen.findByRole("banner");
    expect(await within(header).findByText("Jo")).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "Switch profile" })).toBeInTheDocument();
    expect(
      within(header).getByRole("button", { name: "Sign out of this device" }),
    ).toBeInTheDocument();
  });

  it("switches profile: locks to the picker, then opens the next person", async () => {
    signedInAs("Jo");
    renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });

    await userEvent.click(screen.getByRole("button", { name: "Switch profile" }));

    expect(
      await screen.findByRole("heading", { name: "Who's using Cadence?" }),
    ).toBeInTheDocument();
    expect(mockApi.sessions.profileId).toBeNull();
    await userEvent.click(await screen.findByRole("button", { name: /^Sam/ }));
    expect(await screen.findByRole("heading", { name: "Hello, Sam" })).toBeInTheDocument();
  });

  it("signs the device out after confirmation", async () => {
    signedInAs("Jo");
    renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });

    await userEvent.click(screen.getByRole("button", { name: "Sign out of this device" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Sign out" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Sign in to your family" }),
    ).toBeInTheDocument();
    expect(mockApi.sessions.family).toBe(false);
  });
});

describe("rights from Me.permissions", () => {
  it("shows parent-only controls to a parent", async () => {
    signedInAs("Alex");
    renderApp("/");

    expect(await screen.findByRole("link", { name: "Family settings" })).toBeInTheDocument();
  });

  it("leaves parent-only controls out for a child, and keeps them out by URL", async () => {
    signedInAs("Sam");
    const { router } = renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Sam" });

    expect(screen.queryByRole("link", { name: "Family settings" })).not.toBeInTheDocument();

    await act(() => router.navigate({ to: "/settings" }));
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByRole("heading", { name: "Family settings" })).not.toBeInTheDocument();
  });
});

describe("PIN advice", () => {
  it("advises a parent without a PIN in a family with a child, until dismissed", async () => {
    signedInAs("Jo");
    renderApp("/");

    expect(await screen.findByText("Consider setting a PIN")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Consider setting a PIN")).not.toBeInTheDocument();
  });

  it("remembers the dismissal for that profile on this device across unlocks", async () => {
    signedInAs("Jo");
    renderApp("/");
    await screen.findByText("Consider setting a PIN");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await switchTo("Jo");

    expect(screen.queryByText("Consider setting a PIN")).not.toBeInTheDocument();
  });

  it("shows the advice again if it stops applying and later applies again", async () => {
    signedInAs("Jo");
    renderApp("/");
    await screen.findByText("Consider setting a PIN");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    // Jo sets a PIN (advice no longer applies), then removes it again.
    mockApi.profile("Jo").pin = "123456";
    await switchTo("Jo", "123456");
    expect(screen.queryByText("Consider setting a PIN")).not.toBeInTheDocument();
    mockApi.profile("Jo").pin = null;
    await switchTo("Jo");

    expect(await screen.findByText("Consider setting a PIN")).toBeInTheDocument();
  });

  it("does not advise a parent who has a PIN, or a child", async () => {
    signedInAs("Alex");
    const first = renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Alex" });
    expect(screen.queryByText("Consider setting a PIN")).not.toBeInTheDocument();
    first.unmount();

    signedInAs("Sam");
    renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Sam" });
    expect(screen.queryByText("Consider setting a PIN")).not.toBeInTheDocument();
  });
});

describe("401 routing", () => {
  it("sends the device to the picker when the profile session has gone", async () => {
    signedInAs("Jo");
    const { queryClient, router } = renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });

    server.use(identity.profileSessionExpired("get", "/me"));
    await act(() => queryClient.refetchQueries({ queryKey: ["auth", "me"] }));

    expect(
      await screen.findByRole("heading", { name: "Who's using Cadence?" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/picker");
  });

  it("sends the device to login when the family session has gone", async () => {
    signedInAs("Jo");
    const { queryClient, router } = renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });

    server.use(identity.familySessionExpired("get", "/me"));
    await act(() => queryClient.refetchQueries({ queryKey: ["auth", "me"] }));

    expect(
      await screen.findByRole("heading", { name: "Sign in to your family" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("routes any request's 401 the same way, e.g. a failed lock", async () => {
    signedInAs("Jo");
    renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });

    server.use(identity.familySessionExpired("delete", "/auth/profile-session"));
    await userEvent.click(screen.getByRole("button", { name: "Switch profile" }));

    expect(
      await screen.findByRole("heading", { name: "Sign in to your family" }),
    ).toBeInTheDocument();
  });
});

describe("auto-lock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("locks back to the picker after the family's idle time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    signedInAs("Jo", 1);
    renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });

    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(mockApi.sessions.profileId).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(
      await screen.findByRole("heading", { name: "Who's using Cadence?" }),
    ).toBeInTheDocument();
    expect(mockApi.sessions.profileId).toBeNull();
  });
});

describe("requests", () => {
  it("bootstraps the app with the session and Me in parallel, nothing more", async () => {
    mockApi.reset({
      profiles: standardFamily(),
      signedIn: true,
      activeProfile: "Jo",
      // Slow answers, so a sequential request would start only after the first answer.
      latencyMs: 50,
    });
    const started: string[] = [];
    let firstResponseAfter = -1;
    const recorder = recordRequests();
    server.events.on("request:start", () => started.push("start"));
    server.events.on("response:mocked", () => {
      if (firstResponseAfter < 0) firstResponseAfter = started.length;
    });

    renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });
    await waitFor(() => {
      expect(recorder.identity).toHaveLength(2);
    });

    expect(recorder.identity.toSorted()).toEqual(["GET /auth/session", "GET /me"]);
    // Both requests were sent before the first answer came back: no waterfall.
    expect(firstResponseAfter).toBeGreaterThanOrEqual(2);
    server.events.removeAllListeners();
  });

  it("switches profile in three requests: lock, picker, select", async () => {
    signedInAs("Jo");
    renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });
    const recorder = recordRequests();

    await userEvent.click(screen.getByRole("button", { name: "Switch profile" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Sam/ }));
    await screen.findByRole("heading", { name: "Hello, Sam" });

    expect(recorder.identity).toEqual([
      "DELETE /auth/profile-session",
      "GET /profiles",
      "POST /auth/profile-session",
    ]);
    recorder.stop();
  });

  it("does not refetch Me or the session when moving between app screens", async () => {
    mockApi.reset({
      profiles: [mockProfile({ name: "Jo" })],
      signedIn: true,
      activeProfile: "Jo",
    });
    const { router } = renderApp("/");
    await screen.findByRole("heading", { name: "Hello, Jo" });
    const recorder = recordRequests();

    await act(() => router.navigate({ to: "/settings" }));
    await screen.findByRole("heading", { name: "Family settings" });
    await act(() => router.navigate({ to: "/" }));
    await screen.findByRole("heading", { name: "Hello, Jo" });

    expect(recorder.identity).toEqual([]);
    recorder.stop();
  });
});
