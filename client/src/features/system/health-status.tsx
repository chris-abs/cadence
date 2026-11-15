import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHealth } from "./health";

export function HealthStatus() {
  const { status, refetch, isFetching } = useHealth();

  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3">
      {status === "pending" && (
        <>
          <LoaderCircle aria-hidden className="size-5 animate-spin text-muted-foreground" />
          <span>Checking API…</span>
        </>
      )}
      {status === "success" && (
        <>
          <CircleCheck aria-hidden className="size-5 text-emerald-600" />
          <span>API online</span>
        </>
      )}
      {status === "error" && (
        <>
          <CircleAlert aria-hidden className="size-5 text-destructive" />
          <span>API unreachable</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
