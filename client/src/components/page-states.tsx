import type { ReactNode } from "react";
import { StatusLine } from "@/components/status-line";
import { Button } from "@/components/ui/button";

/** Centres one status line in the space it is given (the screen, or the shell's main). */
function Centred({ children }: { children: ReactNode }) {
  return <div className="flex min-h-64 flex-1 items-center justify-center p-4">{children}</div>;
}

/** Shown while a screen's data loads. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Centred>
      <StatusLine tone="loading">{label}</StatusLine>
    </Centred>
  );
}

interface ErrorStateProps {
  message?: string;
  /** Shows a Try again button. */
  onRetry?: () => void;
}

/** Shown when a screen's data could not load. */
export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <Centred>
      <StatusLine
        tone="error"
        action={
          onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )
        }
      >
        {message}
      </StatusLine>
    </Centred>
  );
}
