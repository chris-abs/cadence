import { StatusLine } from "@/components/status-line";
import { Button } from "@/components/ui/button";
import { useHealth } from "./health";

export function HealthStatus() {
  const { status, refetch, isFetching } = useHealth();

  if (status === "pending") return <StatusLine tone="loading">Checking API…</StatusLine>;
  if (status === "success") return <StatusLine tone="success">API online</StatusLine>;
  return (
    <StatusLine
      tone="error"
      action={
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
          Retry
        </Button>
      }
    >
      API unreachable
    </StatusLine>
  );
}
