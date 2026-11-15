import { useState } from "react";
import { Banner } from "@/components/banner";

/**
 * Advice for a parent without a PIN in a family with a child (`Me.pinAdvised`).
 * Never forced (decision 0003). Dismissal lasts until the device locks: the
 * banner's layout unmounts then, and the next parent sees it afresh.
 */
export function PinAdviceBanner({ advised }: { advised: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (!advised || dismissed) return null;
  return (
    <Banner
      tone="warning"
      title="Consider setting a PIN"
      onDismiss={() => {
        setDismissed(true);
      }}
    >
      Your family has a child profile. A PIN on your profile keeps parent controls to you.
    </Banner>
  );
}
