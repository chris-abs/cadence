import { Link, Navigate, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { useAutoLock } from "./auto-lock";
import { Can } from "./can";
import { useLock } from "./mutations";
import { PinAdviceBanner } from "./pin-advice-banner";
import { ProfileMenu } from "./profile-menu";
import { useFamilySession, useMe } from "./queries";

/**
 * Screens that need a signed-in device. The route guard checks on entry; this
 * follows the session afterwards, e.g. when a request answers
 * `family_session_required` and the session guard clears it.
 */
export function FamilySessionLayout() {
  const { data: session } = useFamilySession();
  if (session === null) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Screens that need an active profile: the app shell, with auto-lock. */
export function ProfileSessionLayout() {
  const { data: me } = useMe();
  if (me === null) return <Navigate to="/picker" replace />;
  if (me === undefined) return <LoadingState />;

  return (
    <AppShell
      nav={
        <Can permission="family.view">
          <Button variant="ghost" asChild>
            <Link to="/settings">Family settings</Link>
          </Button>
        </Can>
      }
      actions={<ProfileMenu me={me} />}
      notices={<PinAdviceBanner key={me.profile.id} advised={me.pinAdvised} />}
    >
      <AutoLock minutes={me.family.autoLockMinutes} />
      <Outlet />
    </AppShell>
  );
}

/** Renders nothing; locks the device after the family's idle time. */
function AutoLock({ minutes }: { minutes: number }) {
  const lock = useLock();
  useAutoLock(minutes, () => {
    lock.mutate();
  });
  return null;
}
