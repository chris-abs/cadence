import { createFileRoute } from "@tanstack/react-router";
import { ProfileSessionLayout, requireProfileSession } from "@/features/auth";

/** The app itself: needs an active profile. */
export const Route = createFileRoute("/_family/_profile")({
  beforeLoad: ({ context }) => requireProfileSession(context.queryClient),
  component: ProfileSessionLayout,
});
