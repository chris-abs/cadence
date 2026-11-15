import type { ReactNode } from "react";

interface PageProps {
  /** The page's one `h1`. */
  title: string;
  description?: string;
  children?: ReactNode;
}

/** The content of one screen: its heading, then its sections, evenly spaced. */
export function Page({ title, description, children }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
