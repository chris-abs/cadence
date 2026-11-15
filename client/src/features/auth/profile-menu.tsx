import { Lock } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { useLock } from "./mutations";
import type { Me } from "./queries";
import { SignOutButton } from "./sign-out-button";

/** The header's trailing area: who is active, and the ways to leave. */
export function ProfileMenu({ me }: { me: Me }) {
  const lock = useLock();
  const { profile } = me;
  return (
    <>
      <span className="flex items-center gap-2">
        <ProfileAvatar name={profile.name} colour={profile.colour} size="sm" />
        <span className="font-medium">
          <span className="sr-only">Signed in as </span>
          {profile.name}
        </span>
      </span>
      <Button
        variant="outline"
        disabled={lock.isPending}
        onClick={() => {
          lock.mutate();
        }}
      >
        <Lock aria-hidden />
        Switch profile
      </Button>
      <SignOutButton />
    </>
  );
}
