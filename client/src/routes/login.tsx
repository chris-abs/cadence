import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen, requireSignedOut } from "@/features/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => requireSignedOut(context.queryClient),
  component: LoginScreen,
});
