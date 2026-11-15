import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Banner } from "@/components/banner";
import { CenteredLayout } from "@/components/centered-layout";
import { Countdown } from "@/components/countdown";
import { ErrorState, LoadingState } from "@/components/page-states";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Stack } from "@/components/stack";
import { Tile, TileList, TileListItem } from "@/components/tile";
import { errorMessage } from "@/lib/forms";
import { useSelectProfile } from "./mutations";
import { authKeys, type ProfileSummary, useFamilySession, useProfiles } from "./queries";
import { SignOutButton } from "./sign-out-button";

/** "Who's using Cadence?": the tablet's home screen between people. */
export function ProfilePicker() {
  const { data: session } = useFamilySession();
  const profiles = useProfiles();
  const select = useSelectProfile();
  const navigate = useNavigate();

  function choose(profile: ProfileSummary) {
    if (profile.hasPin) {
      void navigate({ to: "/picker/$profileId", params: { profileId: profile.id } });
    } else {
      select.mutate({ profileId: profile.id });
    }
  }

  return (
    <CenteredLayout
      title="Who's using Cadence?"
      description={session?.family.name}
      width="wide"
      footer={<SignOutButton />}
    >
      {profiles.status === "pending" && <LoadingState label="Loading profiles…" />}
      {profiles.status === "error" && (
        <ErrorState
          message="Could not load the profiles."
          onRetry={() => void profiles.refetch()}
        />
      )}
      {profiles.status === "success" && (
        <Stack>
          {select.error && <Banner tone="error">{errorMessage(select.error)}</Banner>}
          <TileList>
            {profiles.data.map((profile) => (
              <TileListItem key={profile.id}>
                <Tile
                  media={
                    <ProfileAvatar
                      name={profile.name}
                      colour={profile.colour}
                      size="lg"
                      locked={profile.hasPin}
                    />
                  }
                  title={profile.name}
                  hint={profile.hasPin ? "PIN protected." : undefined}
                  detail={
                    select.isPending && select.variables.profileId === profile.id ? (
                      "Opening…"
                    ) : (
                      <LockStatus lockedUntil={profile.lockedUntil} />
                    )
                  }
                  busy={select.isPending && select.variables.profileId === profile.id}
                  disabled={select.isPending}
                  onSelect={() => {
                    choose(profile);
                  }}
                />
              </TileListItem>
            ))}
          </TileList>
        </Stack>
      )}
    </CenteredLayout>
  );
}

/** The live countdown of a locked-out profile; only the timer ticks. */
function LockStatus({ lockedUntil }: { lockedUntil: string | null }) {
  const queryClient = useQueryClient();
  if (!lockedUntil) return null;
  const until = Date.parse(lockedUntil);
  return (
    <>
      Locked for{" "}
      <Countdown
        key={until}
        until={until}
        onEnd={() => void queryClient.invalidateQueries({ queryKey: authKeys.profiles })}
      />
    </>
  );
}
