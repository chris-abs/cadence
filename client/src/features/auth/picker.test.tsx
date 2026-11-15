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
    expect(alex).toHaveAccessibleName(/PIN protected/);
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

  it("locks the pad with a live countdown after too many wrong PINs", async () => {
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

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Too many wrong PINs");
    expect(within(alert).getByRole("timer")).toHaveTextContent(/^0:(30|29)$/);
    expect(screen.getByRole("button", { name: "1" })).toBeDisabled();
    expect(screen.getByLabelText("PIN for Alex")).toBeDisabled();
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

  it("shows a missing profile instead of a PIN pad", async () => {
    mockApi.reset({ profiles: standardFamily(), signedIn: true });
    renderApp("/picker/01900000-0000-7000-8000-999999999999");

    expect(await screen.findByRole("heading", { name: "Profile not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose another profile" })).toBeInTheDocument();
  });
});
