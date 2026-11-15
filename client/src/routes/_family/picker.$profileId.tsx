import { createFileRoute } from "@tanstack/react-router";
import { PinScreen } from "@/features/auth";

export const Route = createFileRoute("/_family/picker/$profileId")({
  component: PinRoute,
});

function PinRoute() {
  const { profileId } = Route.useParams();
  return <PinScreen profileId={profileId} />;
}
