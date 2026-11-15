import { act, render, screen } from "@testing-library/react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Countdown } from "./countdown";

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks down each second and calls onEnd once at zero", () => {
    const onEnd = vi.fn<() => void>();
    render(<Countdown until={Date.now() + 65_000} onEnd={onEnd} />);

    const timer = screen.getByRole("timer");
    expect(timer).toHaveTextContent("1:05");
    expect(timer).toHaveAttribute("aria-live", "off");

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(timer).toHaveTextContent("0:59");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(timer).toHaveTextContent("0:00");
    expect(onEnd).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("ends at once when the time has already passed", () => {
    const onEnd = vi.fn<() => void>();
    render(<Countdown until={Date.now() - 1} onEnd={onEnd} />);

    expect(screen.getByRole("timer")).toHaveTextContent("0:00");
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("re-renders only itself on a tick, never its parent", () => {
    const parentRenders = vi.fn<() => void>();
    const timerCommits = vi.fn<ProfilerOnRenderCallback>();
    function Parent() {
      parentRenders();
      return (
        <p>
          Locked for{" "}
          <Profiler id="timer" onRender={timerCommits}>
            <Countdown until={Date.now() + 10_000} />
          </Profiler>
        </p>
      );
    }
    render(<Parent />);
    const before = timerCommits.mock.calls.length;

    for (let tick = 0; tick < 3; tick++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(parentRenders).toHaveBeenCalledOnce();
    expect(timerCommits.mock.calls.length - before).toBe(3);
  });
});
