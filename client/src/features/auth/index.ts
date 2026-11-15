// The auth feature's public API: session state, rights, guards and screens.
// Other features use the session state and rights; routes use the guards and screens.

// Session state (read-only; the cache is written only by this feature).
export { type Me, useActiveMe, useMe } from "./queries";
export { Can } from "./can";
export { type FamilyPermission, type Permission, usePermission } from "./permissions";
export { installSessionGuard } from "./session-cache";

// Route guards for `beforeLoad`.
export {
  requireFamilySession,
  requirePermission,
  requireProfileSession,
  requireRegistrationOpen,
  requireSignedOut,
} from "./guards";

// Screens and layouts.
export { FamilySessionLayout, ProfileSessionLayout } from "./layouts";
export { LoginScreen } from "./login-screen";
export { PinScreen } from "./pin-screen";
export { ProfilePicker } from "./profile-picker";
export { RegisterScreen } from "./register-screen";
