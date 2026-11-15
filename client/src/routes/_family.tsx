import { createFileRoute } from "@tanstack/react-router";
import { FamilySessionLayout, requireFamilySession } from "@/features/auth";

/** Everything behind a signed-in device: the picker and the app. */
export const Route = createFileRoute("/_family")({
  beforeLoad: ({ context, location }) =>
    requireFamilySession(context.queryClient, {
      // Every screen but the picker needs a profile too; load both at once.
      prefetchMe: !location.pathname.startsWith("/picker"),
    }),
  component: FamilySessionLayout,
});
