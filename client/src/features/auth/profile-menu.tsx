import { Lock } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Stack } from "@/components/stack";
import { Text, VisuallyHidden } from "@/components/text";
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
      <Stack direction="row" gap="sm" align="center">
        <ProfileAvatar name={profile.name} colour={profile.colour} size="sm" />
        <Text as="span" weight="medium">
          <VisuallyHidden>Signed in as </VisuallyHidden>
          {profile.name}
        </Text>
      </Stack>
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
