import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { requirePermission } from "@/features/auth";

/** Extension point for family management (a later milestone). */
export const Route = createFileRoute("/_family/_profile/settings")({
  beforeLoad: ({ context }) => requirePermission(context.queryClient, "family.view"),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <Page
      title="Family settings"
      description="Managing the family, profiles and devices arrives in a later update."
    />
  );
}
