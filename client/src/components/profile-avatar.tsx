import { cva } from "class-variance-authority";
import { cn } from "cn";
import { Lock } from "lucide-react";
import { profileColourClasses, type ProfileColour } from "./profile-colours";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center rounded-full font-heading font-semibold select-none",
  {
    variants: {
      size: {
        sm: "size-8 text-sm",
        md: "size-12 text-lg",
        lg: "size-24 text-3xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const badgeVariants = cva(
  "absolute -right-1 -bottom-1 inline-flex items-center justify-center rounded-full bg-background text-muted-foreground ring-2 ring-background",
  {
    variants: {
      size: {
        sm: "size-4 [&_svg]:size-2.5",
        md: "size-5 [&_svg]:size-3",
        lg: "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** Up to two initials: "Jo" → "J", "Mary Ann" → "MA". */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words.at(-1)] : [words[0]];
  return letters
    .map((w) => w?.charAt(0) ?? "")
    .join("")
    .toUpperCase();
}

interface ProfileAvatarProps {
  name: string;
  colour: ProfileColour;
  size?: "sm" | "md" | "lg";
  /** Adds a small lock badge, e.g. for a PIN-protected profile. */
  locked?: boolean;
}

/**
 * A person's initials on their profile colour. Decorative: the name is always
 * shown or announced next to it, so the avatar itself is hidden from screen readers.
 */
export function ProfileAvatar({ name, colour, size = "md", locked = false }: ProfileAvatarProps) {
  return (
    <span
      aria-hidden
      data-colour={colour}
      className={cn(avatarVariants({ size }), profileColourClasses[colour])}
    >
      {initials(name)}
      {locked && (
        <span className={badgeVariants({ size })}>
          <Lock />
        </span>
      )}
    </span>
  );
}
