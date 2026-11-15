import { useEffect, useRef } from "react";

/** What counts as someone using the device. Pointer moves alone do not. */
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
/** Activity closer together than this is the same activity. */
const THROTTLE_MS = 1000;

/**
 * Calls `onLock` after `minutes` without activity (spec §2, "Lock back to the
 * picker"). The last activity time lives in the effect's closure, never in
 * React state, so activity causes no render. Listeners are passive and
 * throttled; one timer re-arms itself for the remaining idle time. A tab
 * coming back from the background is checked at once, since browsers delay
 * timers in hidden tabs.
 */
export function useAutoLock(minutes: number, onLock: () => void) {
  const onLockRef = useRef(onLock);
  useEffect(() => {
    onLockRef.current = onLock;
  });

  useEffect(() => {
    const idleMs = minutes * 60_000;
    let lastActivity = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    function arm(delay: number) {
      clearTimeout(timer);
      timer = setTimeout(check, delay);
    }

    function check() {
      const idle = Date.now() - lastActivity;
      if (idle < idleMs) {
        arm(idleMs - idle);
        return;
      }
      onLockRef.current();
      // If the lock request fails the screen stays; lock again after another idle spell.
      lastActivity = Date.now();
      arm(idleMs);
    }

    function onActivity() {
      const now = Date.now();
      if (now - lastActivity >= THROTTLE_MS) lastActivity = now;
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") check();
    }

    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, onActivity, { passive: true, capture: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    arm(idleMs);

    return () => {
      clearTimeout(timer);
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, onActivity, { capture: true });
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [minutes]);
}
