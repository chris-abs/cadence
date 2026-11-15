import { createFileRoute } from "@tanstack/react-router";
import { ProfilePicker } from "@/features/auth";

export const Route = createFileRoute("/_family/picker/")({
  component: ProfilePicker,
});
