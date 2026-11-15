import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useActiveMe } from "@/features/auth";
import { SystemStatusCard } from "@/features/system";

export const Route = createFileRoute("/_family/_profile/")({
  component: HomePage,
});

/** Placeholder home until the first module (meals) arrives. */
function HomePage() {
  const { profile, family } = useActiveMe();
  return (
    <Page title={`Hello, ${profile.name}`} description={family.name}>
      <SystemStatusCard />
    </Page>
  );
}
