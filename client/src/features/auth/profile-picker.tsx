import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Banner } from "@/components/banner";
import { CenteredLayout } from "@/components/centered-layout";
import { Countdown } from "@/components/countdown";
import { ErrorState, LoadingState } from "@/components/page-states";
import { ProfileAvatar } from "@/components/profile-avatar";
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
        <div className="grid gap-4">
          {select.error && <Banner tone="error">{errorMessage(select.error)}</Banner>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {profiles.data.map((profile) => (
              <li key={profile.id}>
                <ProfileTile
                  profile={profile}
                  pending={select.isPending && select.variables.profileId === profile.id}
                  disabled={select.isPending}
                  onChoose={choose}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </CenteredLayout>
  );
}

interface ProfileTileProps {
  profile: ProfileSummary;
  pending: boolean;
  disabled: boolean;
  onChoose: (profile: ProfileSummary) => void;
}

function ProfileTile({ profile, pending, disabled, onChoose }: ProfileTileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={pending || undefined}
      onClick={() => {
        onChoose(profile);
      }}
      className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card p-4 text-center transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:opacity-60"
    >
      <ProfileAvatar
        name={profile.name}
        colour={profile.colour}
        size="lg"
        locked={profile.hasPin}
      />
      <span className="font-heading text-lg font-medium">{profile.name}</span>
      <span className="text-sm text-muted-foreground">
        {profile.hasPin && <span className="sr-only">PIN protected. </span>}
        {pending ? "Opening…" : <LockStatus lockedUntil={profile.lockedUntil} />}
      </span>
    </button>
  );
}

/** The live countdown of a locked-out profile; only this text ticks. */
function LockStatus({ lockedUntil }: { lockedUntil: string | null }) {
  const queryClient = useQueryClient();
  if (!lockedUntil) return null;
  const until = Date.parse(lockedUntil);
  return (
    <span>
      Locked for{" "}
      <Countdown
        key={until}
        until={until}
        onEnd={() => void queryClient.invalidateQueries({ queryKey: authKeys.profiles })}
      />
    </span>
  );
}
