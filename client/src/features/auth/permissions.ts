import { useMe } from "./queries";

/** The identity rights the server reports in `Me.permissions` (spec §5.1). */
export type FamilyPermission =
  | "family.view"
  | "family.edit"
  | "family.modules.manage"
  | "family.profiles.create"
  | "family.profiles.edit"
  | "family.profiles.role"
  | "family.profiles.delete"
  | "family.pins.reset_child"
  | "family.pins.reset_parent"
  | "family.sessions.manage"
  | "family.account.manage";

/** An identity right or a module right such as `meals.recipes.edit`. */
export type Permission = FamilyPermission | `${string}.${string}`;

/**
 * Whether the active profile has `permission` now. Reads the same list the
 * server enforces, so the client never re-derives rights from the role.
 * False while `Me` is loading or no profile is active.
 */
export function usePermission(permission: Permission): boolean {
  const { data: me } = useMe();
  return me?.permissions.includes(permission) ?? false;
}
