import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProfilerOnRenderCallback } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as LayoutModule from "@/components/centered-layout";
import { CenteredLayout } from "@/components/centered-layout";
import type * as AvatarModule from "@/components/profile-avatar";
import { ProfileAvatar } from "@/components/profile-avatar";
import { pressKeys } from "@/test/actions";
import { mockApi, mockProfile } from "@/test/mock-api";
import { renderApp } from "@/test/render-app";

// Count renders of the picker grid's avatars and of the page frame, unchanged otherwise.
vi.mock("@/components/profile-avatar", async (importOriginal) => {
  const original = await importOriginal<typeof AvatarModule>();
  return {
    ...original,
    ProfileAvatar: vi.fn<typeof original.ProfileAvatar>(original.ProfileAvatar),
  };
});
vi.mock("@/components/centered-layout", async (importOriginal) => {
  const original = await importOriginal<typeof LayoutModule>();
  return {
    ...original,
    CenteredLayout: vi.fn<typeof original.CenteredLayout>(original.CenteredLayout),
  };
});

describe("render budget", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("typing in the login form commits no render anywhere", async () => {
    const commits = vi.fn<ProfilerOnRenderCallback>();
    renderApp("/login", { onRender: commits });
    const email = await screen.findByLabelText("Email");
    // Let the registration status request settle first.
    await screen.findByRole("link", { name: "Create a family" });
    const before = commits.mock.calls.length;

    await userEvent.type(email, "family@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "a password");

    expect(commits.mock.calls.length - before).toBe(0);
  });

  it("a lockout countdown tick re-renders neither the picker grid nor the page", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockApi.reset({
      profiles: [
        mockProfile({ name: "Jo" }),
        mockProfile({
          name: "Alex",
          pin: "123456",
          lockedUntil: new Date(Date.now() + 60_000).toISOString(),
        }),
        mockProfile({ name: "Sam", role: "CHILD" }),
      ],
      signedIn: true,
    });
    renderApp("/picker");
    const timer = await screen.findByRole("timer");
    const avatarRenders = vi.mocked(ProfileAvatar).mock.calls.length;
    const layoutRenders = vi.mocked(CenteredLayout).mock.calls.length;
    const shown = timer.textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(timer.textContent).not.toBe(shown);
    expect(vi.mocked(ProfileAvatar).mock.calls.length - avatarRenders).toBe(0);
    expect(vi.mocked(CenteredLayout).mock.calls.length - layoutRenders).toBe(0);
  });

  it("a PIN-pad lockout tick re-renders neither the pad nor the page", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    const timer = await screen.findByRole("timer");
    const layoutRenders = vi.mocked(CenteredLayout).mock.calls.length;
    const shown = timer.textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(timer.textContent).not.toBe(shown);
    expect(vi.mocked(CenteredLayout).mock.calls.length - layoutRenders).toBe(0);
  });
});
