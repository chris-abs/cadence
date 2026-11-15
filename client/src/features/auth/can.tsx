import type { ReactNode } from "react";
import { type Permission, usePermission } from "./permissions";

interface CanProps {
  permission: Permission;
  children: ReactNode;
  /** Shown instead when the right is missing; nothing by default. */
  fallback?: ReactNode;
}

/** Renders its children only for a profile with `permission`. */
export function Can({ permission, children, fallback = null }: CanProps) {
  return usePermission(permission) ? children : fallback;
}
