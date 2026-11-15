import { type ReactNode, useId } from "react";

/** A responsive grid of tiles: two across on a phone, up to four on a tablet. */
export function TileList({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</ul>;
}

export function TileListItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

interface TileProps {
  /** Large visual above the title, e.g. an avatar. */
  media: ReactNode;
  title: string;
  /** A short line under the title, e.g. a status. */
  detail?: ReactNode;
  /** Extra words for screen readers, read with the detail as the tile's description. */
  hint?: string;
  disabled?: boolean;
  /** Marks the tile whose action is in progress. */
  busy?: boolean;
  onSelect: () => void;
}

/** A large, finger-sized choice button: the family tablet's main control. */
export function Tile({ media, title, detail, hint, disabled, busy = false, onSelect }: TileProps) {
  const id = useId();
  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={busy || undefined}
      // Named by the title alone; the hint and the status line describe it.
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-hint ${id}-detail`}
      onClick={onSelect}
      className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card p-4 text-center transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:opacity-60"
    >
      {media}
      <span id={`${id}-title`} className="font-heading text-lg font-medium">
        {title}
      </span>
      <span id={`${id}-hint`} className="sr-only">
        {hint}
      </span>
      <span id={`${id}-detail`} className="min-h-5 text-sm text-muted-foreground">
        {detail}
      </span>
    </button>
  );
}
