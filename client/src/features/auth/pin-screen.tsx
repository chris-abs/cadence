import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useId } from "react";
import { Banner } from "@/components/banner";
import { CenteredLayout } from "@/components/centered-layout";
import { Countdown } from "@/components/countdown";
import { ErrorState, LoadingState } from "@/components/page-states";
import { PinPad } from "@/components/pin-pad";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/forms";
import { useSelectProfile } from "./mutations";
import { authKeys, type ProfileSummary, useProfiles } from "./queries";
import { retryAt } from "./retry-after";

function BackToPicker() {
  return (
    <Button variant="ghost" asChild>
      <Link to="/picker">
        <ArrowLeft aria-hidden />
        Choose another profile
      </Link>
    </Button>
  );
}

/** The PIN pad for one profile, reached from the picker. */
export function PinScreen({ profileId }: { profileId: string }) {
  const profiles = useProfiles();

  if (profiles.status === "pending") return <LoadingState label="Loading profile…" />;
  if (profiles.status === "error") {
    return (
      <ErrorState message="Could not load the profile." onRetry={() => void profiles.refetch()} />
    );
  }
  const profile = profiles.data.find((p) => p.id === profileId);
  if (!profile) {
    return (
      <CenteredLayout title="Profile not found" footer={<BackToPicker />}>
        <p className="text-muted-foreground">This profile is no longer on this family.</p>
      </CenteredLayout>
    );
  }
  return <PinEntry profile={profile} />;
}

function PinEntry({ profile }: { profile: ProfileSummary }) {
  const select = useSelectProfile();
  const queryClient = useQueryClient();
  const messageId = useId();

  // A lockout is known from this attempt's 429, or from the server's profile.
  const lockedUntil =
    retryAt(select) ?? (profile.lockedUntil ? Date.parse(profile.lockedUntil) : undefined);
  const wrongPin = select.error instanceof ApiError && select.error.code === "invalid_pin";

  function endLockout() {
    select.reset();
    void queryClient.invalidateQueries({ queryKey: authKeys.profiles });
  }

  return (
    <CenteredLayout
      title={profile.name}
      description={
        lockedUntil === undefined ? "Enter your PIN" : "This profile is locked for a while"
      }
      media={<ProfileAvatar name={profile.name} colour={profile.colour} size="lg" />}
      footer={<BackToPicker />}
    >
      <div className="grid gap-6">
        <div id={messageId}>
          {lockedUntil !== undefined ? (
            <Banner tone="error" title="Too many wrong PINs">
              Try again in <Countdown key={lockedUntil} until={lockedUntil} onEnd={endLockout} />.
            </Banner>
          ) : wrongPin ? (
            <Banner tone="error">That PIN is not right. Try again.</Banner>
          ) : (
            select.error && <Banner tone="error">{errorMessage(select.error)}</Banner>
          )}
        </div>
        <PinPad
          label={`PIN for ${profile.name}`}
          describedBy={messageId}
          invalid={wrongPin}
          disabled={lockedUntil !== undefined}
          busy={select.isPending}
          onComplete={(pin) => {
            select.mutate({ profileId: profile.id, pin });
          }}
        />
      </div>
    </CenteredLayout>
  );
}
