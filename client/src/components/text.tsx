import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

const textVariants = cva("", {
  variants: {
    size: {
      sm: "text-sm",
      base: "text-base",
      lg: "font-heading text-lg",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      error: "text-destructive",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
    },
  },
  defaultVariants: { size: "base", tone: "default", weight: "normal" },
});

type TextProps = VariantProps<typeof textVariants> & {
  /** `p` for a paragraph (default), `span` inside other text. */
  as?: "p" | "span";
  children: ReactNode;
};

/** Body text in one of the theme's sizes and tones. */
export function Text({ as: Tag = "p", size, tone, weight, children }: TextProps) {
  return <Tag className={textVariants({ size, tone, weight })}>{children}</Tag>;
}

/** Text for screen readers only, e.g. context an icon or layout gives sighted users. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
