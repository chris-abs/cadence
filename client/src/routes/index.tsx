import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { SystemStatusCard } from "@/features/system";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <Page title="Welcome to Cadence">
      <SystemStatusCard />
    </Page>
  );
}
