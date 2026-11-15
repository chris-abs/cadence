import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { pressKeys } from "@/test/actions";
import { mockApi, mockProfile, standardFamily } from "@/test/mock-api";
import { renderApp } from "@/test/render-app";

const tile = (name: RegExp) => screen.findByRole("button", { name });

describe("profile picker", () => {
  it("sends a signed-in device without a profile to the picker", async () => {
    mockApi.reset({ profiles: standardFamily(), signedIn: true });
    const { router } = renderApp("/");

    expect(
      await screen.findByRole("heading", { name: "Who's using Cadence?" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/picker");
    expect(screen.getByText("The Harbours")).toBeInTheDocument();
  });

  it("opens the app at once for a profile without a PIN", async () => {
    mockApi.reset({ profiles: standardFamily(), signedIn: true });
    renderApp("/picker");

    await userEvent.click(await tile(/^Sam/));

    expect(await screen.findByRole("heading", { name: "Hello, Sam" })).toBeInTheDocument();
    expect(mockApi.sessions.profileId).toBe(mockApi.profile("Sam").id);
  });

  it("marks PIN-protected profiles and asks for the PIN", async () => {
    mockApi.reset({ profiles: standardFamily(), signedIn: true });
    const { router } = renderApp("/picker");

    const alex = await tile(/^Alex/);
    expect(alex).toHaveAccessibleDescription(/PIN protected/);
    await userEvent.click(alex);

    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/picker/${mockApi.profile("Alex").id}`);
    await pressKeys("123456");

    expect(await screen.findByRole("heading", { name: "Hello, Alex" })).toBeInTheDocument();
  });

  it("says when the PIN is wrong and lets the person try again", async () => {
    mockApi.reset({ profiles: standardFamily(), signedIn: true });
    renderApp(`/picker/${mockApi.profile("Alex").id}`);

    await screen.findByRole("heading", { name: "Alex" });
    await pressKeys("111111");

    expect(await screen.findByRole("alert")).toHaveTextContent("That PIN is not right.");
    const input = screen.getByLabelText("PIN for Alex");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/That PIN is not right/);
    expect(mockApi.sessions.profileId).toBeNull();

    await pressKeys("123456");
    expect(await screen.findByRole("heading", { name: "Hello, Alex" })).toBeInTheDocument();
  });

  it("goes straight to the locked countdown when the wrong PIN that starts a lock answers 429", async () => {
    mockApi.reset({
      profiles: [
        mockProfile({ name: "Jo" }),
        mockProfile({ name: "Alex", pin: "123456", failedPins: 4 }),
      ],
      signedIn: true,
    });
    renderApp(`/picker/${mockApi.profile("Alex").id}`);

    await screen.findByRole("heading", { name: "Alex" });
    await pressKeys("111111");

    // The 5th wrong PIN answers 429 pin_locked at once (spec §2): no "wrong PIN"
    // step, and no extra attempt is needed to see the lock.
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Too many wrong PINs");
    expect(alert).not.toHaveTextContent("That PIN is not right");
    expect(within(alert).getByRole("timer")).toHaveTextContent(/^0:(30|29)$/);
    expect(screen.getByRole("button", { name: "1" })).toBeDisabled();
    expect(screen.getByLabelText("PIN for Alex")).toBeDisabled();
    expect(mockApi.profile("Alex").failedPins).toBe(5);
  });

  it("shows a locked-out profile's countdown on its tile", async () => {
    const lockedUntil = new Date(Date.now() + 90_000).toISOString();
    mockApi.reset({
      profiles: [
        mockProfile({ name: "Jo" }),
        mockProfile({ name: "Alex", pin: "123456", lockedUntil }),
      ],
      signedIn: true,
    });
    renderApp("/picker");

    const alex = await tile(/^Alex/);
    expect(alex).toHaveTextContent(/Locked for 1:(30|29)/);
    expect(within(alex).getByRole("timer")).toBeInTheDocument();
  });

  it("counts a lockout down from lockedForSeconds, whatever the device clock says", async () => {
    // The server's clock is an hour ahead of this device's: its lockedUntil looks
    // 61½ minutes away here, but only 90 seconds are left.
    const serverClockOffsetMs = 3_600_000;
    mockApi.reset({
      profiles: [
        mockProfile({ name: "Jo" }),
        mockProfile({
          name: "Alex",
          pin: "123456",
          lockedUntil: new Date(Date.now() + serverClockOffsetMs + 90_000).toISOString(),
        }),
      ],
      signedIn: true,
      serverClockOffsetMs,
    });
    renderApp("/picker");

    const alex = await tile(/^Alex/);
    expect(within(alex).getByRole("timer")).toHaveTextContent(/^1:(30|29)$/);
  });

  it("keeps loading and ready PIN states in one frame", async () => {
    mockApi.reset({ profiles: standardFamily(), signedIn: true, latencyMs: 100 });
    renderApp(`/picker/${mockApi.profile("Alex").id}`);

    // Loading: the card, its heading and an inert pad are already in place.
    const loading = await screen.findByRole("heading", { name: "Enter PIN" });
    const main = screen.getByRole("main");
    expect(main).toContainElement(loading);
    expect(within(main).getByRole("status")).toHaveTextContent("Loading the profile…");
    expect(within(main).getByLabelText("PIN")).toBeDisabled();
    expect(within(main).getAllByRole("button", { name: /^\d$/ })).toHaveLength(10);

    // Ready: same frame, now Alex's live pad.
    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBe(main);
    expect(screen.getByLabelText("PIN for Alex")).toBeEnabled();
    expect(screen.getAllByRole("button", { name: /^\d$/ })).toHaveLength(10);
  });

  it("shows a missing profile instead of a PIN pad", async () => {
    mockApi.reset({ profiles: standardFamily(), signedIn: true });
    renderApp("/picker/01900000-0000-7000-8000-999999999999");

    expect(await screen.findByRole("heading", { name: "Profile not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose another profile" })).toBeInTheDocument();
  });
});
