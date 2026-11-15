import { cva } from "class-variance-authority";
import { CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const icons = { info: Info, warning: TriangleAlert, error: CircleAlert } as const;

export type BannerTone = keyof typeof icons;

const bannerVariants = cva("flex items-start gap-3 rounded-lg border p-3 text-sm", {
  variants: {
    tone: {
      info: "border-primary/30 bg-primary/5",
      warning: "border-warning/40 bg-warning/10",
      error: "border-destructive/30 bg-destructive/5",
    },
  },
});

const iconVariants = cva("mt-0.5 size-4 shrink-0", {
  variants: {
    tone: { info: "text-primary", warning: "text-warning", error: "text-destructive" },
  },
});

interface BannerProps {
  tone: BannerTone;
  /** Optional bold first line. */
  title?: string;
  children: ReactNode;
  /** Shows a close button; the parent decides what dismissed means. */
  onDismiss?: () => void;
  /** An optional control under the message, e.g. a link to fix the problem. */
  action?: ReactNode;
}

/**
 * A message in the flow of the page. `error` banners are alerts (announced at
 * once); the others are polite status messages.
 */
export function Banner({ tone, title, children, onDismiss, action }: BannerProps) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      data-tone={tone}
      className={bannerVariants({ tone })}
    >
      <Icon aria-hidden className={iconVariants({ tone })} />
      <div className="flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <div className="text-muted-foreground">{children}</div>
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onDismiss && (
        <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={onDismiss}>
          <X aria-hidden />
        </Button>
      )}
    </div>
  );
}
