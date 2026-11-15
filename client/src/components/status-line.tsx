import { cva } from "class-variance-authority";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

const icons = {
  loading: LoaderCircle,
  success: CircleCheck,
  error: CircleAlert,
} as const;

const iconVariants = cva("size-5 shrink-0", {
  variants: {
    tone: {
      loading: "animate-spin text-muted-foreground",
      success: "text-success",
      error: "text-destructive",
    },
  },
});

export type StatusTone = keyof typeof icons;

interface StatusLineProps {
  tone: StatusTone;
  /** The status in words; the icon only repeats it. */
  children: ReactNode;
  /** An optional control at the end of the line, e.g. a Retry button. */
  action?: ReactNode;
}

/**
 * One line of live status: icon, message, optional action. Keep it mounted and
 * change `tone`, so screen readers announce each change.
 */
export function StatusLine({ tone, children, action }: StatusLineProps) {
  const Icon = icons[tone];
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3">
      <Icon aria-hidden data-tone={tone} className={iconVariants({ tone })} />
      <span>{children}</span>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
