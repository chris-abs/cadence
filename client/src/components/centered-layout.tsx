import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";

const widthVariants = cva("w-full", {
  variants: {
    width: {
      /** Forms: sign in, register, PIN. */
      narrow: "max-w-md",
      /** Grids: the profile picker. */
      wide: "max-w-4xl",
    },
  },
  defaultVariants: { width: "narrow" },
});

interface CenteredLayoutProps {
  /** The page's one `h1`. */
  title: string;
  description?: ReactNode;
  width?: "narrow" | "wide";
  /** Shown above the title, e.g. an avatar. */
  media?: ReactNode;
  children: ReactNode;
  /** Secondary links or actions under the card's content. */
  footer?: ReactNode;
}

/** A full-screen page with one centred card: the screens outside the app shell. */
export function CenteredLayout({
  title,
  description,
  width = "narrow",
  media,
  children,
  footer,
}: CenteredLayoutProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-4 sm:p-8">
      <p className="font-heading text-xl font-semibold text-primary">Cadence</p>
      <div className={widthVariants({ width })}>
        <Card>
          <CardHeader>
            {media && <div className="flex justify-center pb-2">{media}</div>}
            <h1 className="font-heading text-2xl font-semibold">{title}</h1>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
      </div>
    </main>
  );
}
