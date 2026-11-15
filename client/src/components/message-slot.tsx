import type { ReactNode } from "react";

interface MessageSlotProps {
  /** Id for `aria-describedby` on the control the message is about. */
  id?: string;
  children?: ReactNode;
}

/**
 * Space reserved for a message above a control (room for a two-line banner),
 * so the control does not jump when a message appears or goes.
 */
export function MessageSlot({ id, children }: MessageSlotProps) {
  return (
    <div id={id} className="flex min-h-18 flex-col justify-center">
      {children}
    </div>
  );
}
