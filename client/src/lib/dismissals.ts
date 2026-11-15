/**
 * Remembers on this device that a piece of advice was dismissed. A UI
 * preference only, never session data. Storage can be missing or throw
 * (private mode, blocked storage, quota); the advice then just shows again.
 */

const PREFIX = "cadence.dismissed.";

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function isDismissed(key: string): boolean {
  try {
    return storage()?.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function setDismissed(key: string, dismissed: boolean): void {
  try {
    if (dismissed) storage()?.setItem(PREFIX + key, "1");
    else storage()?.removeItem(PREFIX + key);
  } catch {
    // Not remembered; the advice shows again next time.
  }
}
