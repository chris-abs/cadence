import { act, fireEvent, render } from "@testing-library/react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoLock } from "./auto-lock";

const MINUTE = 60_000;

function Locker({ minutes, onLock }: { minutes: number; onLock: () => void }) {
  useAutoLock(minutes, onLock);
  return <p>app</p>;
}

describe("useAutoLock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("locks after the idle time", () => {
    const onLock = vi.fn<() => void>();
    render(<Locker minutes={2} onLock={onLock} />);

    vi.advanceTimersByTime(2 * MINUTE - 1);
    expect(onLock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onLock).toHaveBeenCalledOnce();
  });

  it("restarts the idle time on a touch or key press", () => {
    const onLock = vi.fn<() => void>();
    render(<Locker minutes={2} onLock={onLock} />);

    vi.advanceTimersByTime(1.5 * MINUTE);
    fireEvent.pointerDown(document.body);
    vi.advanceTimersByTime(1.5 * MINUTE);
    fireEvent.keyDown(document.body, { key: "a" });
    vi.advanceTimersByTime(1.5 * MINUTE);
    expect(onLock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0.5 * MINUTE);
    expect(onLock).toHaveBeenCalledOnce();
  });

  it("checks at once when a hidden tab becomes visible", () => {
    const onLock = vi.fn<() => void>();
    render(<Locker minutes={1} onLock={onLock} />);
    // A background tab's timers can be delayed; only the clock moves on.
    vi.setSystemTime(Date.now() + 5 * MINUTE);

    fireEvent(document, new Event("visibilitychange"));

    expect(onLock).toHaveBeenCalledOnce();
  });

  it("stops when unmounted", () => {
    const onLock = vi.fn<() => void>();
    const { unmount } = render(<Locker minutes={1} onLock={onLock} />);

    unmount();
    vi.advanceTimersByTime(5 * MINUTE);

    expect(onLock).not.toHaveBeenCalled();
  });

  it("listens passively and never renders on activity", () => {
    const addListener = vi.spyOn(window, "addEventListener");
    const commits = vi.fn<ProfilerOnRenderCallback>();
    render(
      <Profiler id="app" onRender={commits}>
        <Locker minutes={10} onLock={vi.fn<() => void>()} />
      </Profiler>,
    );
    const before = commits.mock.calls.length;

    act(() => {
      for (let i = 0; i < 20; i++) {
        fireEvent.pointerDown(document.body);
        fireEvent.keyDown(document.body, { key: "a" });
        fireEvent.touchStart(document.body);
        fireEvent.wheel(document.body);
        vi.advanceTimersByTime(500);
      }
    });

    expect(commits.mock.calls.length).toBe(before);
    const activityListeners = addListener.mock.calls.filter(([type]) =>
      ["pointerdown", "keydown", "wheel", "touchstart"].includes(type),
    );
    expect(activityListeners).toHaveLength(4);
    for (const [, , options] of activityListeners) {
      expect(options).toMatchObject({ passive: true });
    }
  });
});
