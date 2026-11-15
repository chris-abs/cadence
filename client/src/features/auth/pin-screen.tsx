import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Banner } from "@/components/banner";
import { CenteredLayout } from "@/components/centered-layout";
import { Countdown } from "@/components/countdown";
import { MessageSlot } from "@/components/message-slot";
import { PinPad } from "@/components/pin-pad";
import { AvatarPlaceholder, ProfileAvatar } from "@/components/profile-avatar";
import { Stack } from "@/components/stack";
import { StatusLine } from "@/components/status-line";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/forms";
import { useSelectProfile } from "./mutations";
import { authKeys, useProfiles } from "./queries";
import { lockEnd, retryAt } from "./retry-after";

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

interface PinFrameProps {
  title: string;
  description: string;
  media: ReactNode;
  messageId: string;
  message: ReactNode;
  children: ReactNode;
}

/**
 * The one frame every state of the PIN screen shares (loading, error, missing,
 * locked, ready): same card, avatar slot, message slot and pad, so nothing
 * moves or remounts when the state changes.
 */
function PinFrame({ title, description, media, messageId, message, children }: PinFrameProps) {
  return (
    <CenteredLayout title={title} description={description} media={media} footer={<BackToPicker />}>
      <Stack gap="lg">
        <MessageSlot id={messageId}>{message}</MessageSlot>
        {children}
      </Stack>
    </CenteredLayout>
  );
}

/** The PIN pad for one profile, reached from the picker. */
export function PinScreen({ profileId }: { profileId: string }) {
  const profiles = useProfiles();
  const select = useSelectProfile();
  const queryClient = useQueryClient();
  const messageId = useId();

  const profile =
    profiles.status === "success" ? profiles.data.find((p) => p.id === profileId) : undefined;

  if (!profile) {
    // Loading, failed or missing: the same frame, with an inert pad in place.
    let title = "Enter PIN";
    let description = "Loading the profile…";
    let message: ReactNode = <StatusLine tone="loading">Loading the profile…</StatusLine>;
    if (profiles.status === "error") {
      description = "The profile could not load.";
      message = (
        <StatusLine
          tone="error"
          action={
            <Button variant="outline" onClick={() => void profiles.refetch()}>
              Try again
            </Button>
          }
        >
          Could not load the profile.
        </StatusLine>
      );
    } else if (profiles.status === "success") {
      title = "Profile not found";
      description = "Choose another profile.";
      message = <Banner tone="error">This profile is no longer on this family.</Banner>;
    }
    return (
      <PinFrame
        title={title}
        description={description}
        media={<AvatarPlaceholder size="lg" />}
        messageId={messageId}
        message={message}
      >
        <PinPad label="PIN" describedBy={messageId} disabled onComplete={() => undefined} />
      </PinFrame>
    );
  }

  // A lockout is known from this attempt's 429, or from the picker's profile data;
  // both are relative to when the answer arrived, never to the server's clock.
  const lockedUntil = retryAt(select) ?? lockEnd(profile, profiles.dataUpdatedAt);
  const wrongPin = select.error instanceof ApiError && select.error.code === "invalid_pin";

  function endLockout() {
    select.reset();
    void queryClient.invalidateQueries({ queryKey: authKeys.profiles });
  }

  let message: ReactNode = null;
  if (lockedUntil !== undefined) {
    message = (
      <Banner tone="error" title="Too many wrong PINs">
        Try again in <Countdown key={lockedUntil} until={lockedUntil} onEnd={endLockout} />.
      </Banner>
    );
  } else if (wrongPin) {
    message = <Banner tone="error">That PIN is not right. Try again.</Banner>;
  } else if (select.error) {
    message = <Banner tone="error">{errorMessage(select.error)}</Banner>;
  }

  return (
    <PinFrame
      title={profile.name}
      description={
        lockedUntil === undefined ? "Enter your PIN" : "This profile is locked for a while"
      }
      media={<ProfileAvatar name={profile.name} colour={profile.colour} size="lg" />}
      messageId={messageId}
      message={message}
    >
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
    </PinFrame>
  );
}
