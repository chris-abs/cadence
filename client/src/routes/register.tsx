import { createFileRoute } from "@tanstack/react-router";
import { RegisterScreen, requireRegistrationOpen, requireSignedOut } from "@/features/auth";

export const Route = createFileRoute("/register")({
  beforeLoad: async ({ context }) => {
    await Promise.all([
      requireSignedOut(context.queryClient),
      requireRegistrationOpen(context.queryClient),
    ]);
  },
  component: RegisterScreen,
});
