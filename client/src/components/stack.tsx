import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

const stackVariants = cva("flex", {
  variants: {
    direction: {
      column: "flex-col",
      row: "flex-row flex-wrap",
    },
    gap: {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    },
    align: {
      stretch: "items-stretch",
      start: "items-start",
      center: "items-center",
    },
  },
  defaultVariants: { direction: "column", gap: "md", align: "stretch" },
});

type StackProps = VariantProps<typeof stackVariants> & { children: ReactNode };

/** Lays its children out in a column or a row, evenly spaced. */
export function Stack({ direction, gap, align, children }: StackProps) {
  return (
    <div
      data-direction={direction ?? "column"}
      className={stackVariants({ direction, gap, align })}
    >
      {children}
    </div>
  );
}
