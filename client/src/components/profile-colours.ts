/**
 * The 22 profile colours (Tailwind palette names), in palette order. The shared
 * layer owns this list; the auth feature checks it against the API contract.
 */
export const PROFILE_COLOURS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type ProfileColour = (typeof PROFILE_COLOURS)[number];

/**
 * Soft fill + strong text per colour: every pair keeps text readable in light
 * and dark themes. Spelled out in full so Tailwind finds each class.
 */
export const profileColourClasses: Record<ProfileColour, string> = {
  slate: "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-50",
  gray: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50",
  zinc: "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50",
  neutral: "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50",
  stone: "bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-50",
  red: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-50",
  orange: "bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-50",
  amber: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-50",
  yellow: "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-50",
  lime: "bg-lime-200 text-lime-900 dark:bg-lime-800 dark:text-lime-50",
  green: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-50",
  emerald: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-50",
  teal: "bg-teal-200 text-teal-900 dark:bg-teal-800 dark:text-teal-50",
  cyan: "bg-cyan-200 text-cyan-900 dark:bg-cyan-800 dark:text-cyan-50",
  sky: "bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-50",
  blue: "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-50",
  indigo: "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-50",
  violet: "bg-violet-200 text-violet-900 dark:bg-violet-800 dark:text-violet-50",
  purple: "bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-50",
  fuchsia: "bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-800 dark:text-fuchsia-50",
  pink: "bg-pink-200 text-pink-900 dark:bg-pink-800 dark:text-pink-50",
  rose: "bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-50",
};

/** Human label for a colour key, e.g. `sky` → `Sky`. */
export function colourLabel(colour: ProfileColour): string {
  return colour.charAt(0).toUpperCase() + colour.slice(1);
}
