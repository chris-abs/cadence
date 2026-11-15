import { useEffect, useState } from "react";
import { Banner } from "@/components/banner";
import { isDismissed, setDismissed } from "@/lib/dismissals";

const dismissalKey = (profileId: string) => `pin-advice:${profileId}`;

interface PinAdviceBannerProps {
  profileId: string;
  /** `Me.pinAdvised`: a parent without a PIN in a family with a child. */
  advised: boolean;
}

/**
 * Advice to set a PIN, never forced (decision 0003). A dismissal is remembered
 * per profile on this device, so the family is not asked on every unlock; once
 * the advice stops applying it is forgotten, so it can return if it applies again.
 */
export function PinAdviceBanner({ profileId, advised }: PinAdviceBannerProps) {
  const [dismissed, setDismissedState] = useState(() => isDismissed(dismissalKey(profileId)));

  useEffect(() => {
    // Writes to device storage, not React state: the advice no longer applies.
    if (!advised) setDismissed(dismissalKey(profileId), false);
  }, [advised, profileId]);

  // Advice that stopped applying starts afresh if it applies again (React's
  // "adjust state while rendering" pattern, not an effect).
  if (!advised && dismissed) setDismissedState(false);

  if (!advised || dismissed) return null;
  return (
    <Banner
      tone="warning"
      title="Consider setting a PIN"
      onDismiss={() => {
        setDismissed(dismissalKey(profileId), true);
        setDismissedState(true);
      }}
    >
      Your family has a child profile. A PIN on your profile keeps parent controls to you.
    </Banner>
  );
}
