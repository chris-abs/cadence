import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useLogout } from "./mutations";

/**
 * "Sign out of this device", behind a confirmation: on a shared tablet a stray
 * tap would otherwise mean typing the family password again.
 */
export function SignOutButton() {
  const logout = useLogout();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" disabled={logout.isPending}>
          <LogOut aria-hidden />
          Sign out of this device
        </Button>
      }
      title="Sign out of this device?"
      description="Everyone on this device will need the family email and password to sign in again."
      confirmLabel="Sign out"
      tone="destructive"
      onConfirm={() => {
        logout.mutate();
      }}
    />
  );
}
