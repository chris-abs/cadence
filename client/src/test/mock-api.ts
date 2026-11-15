import { delay, http, HttpResponse, type PathParams } from "msw";
import type { components } from "@/lib/api";
import { apiUrl } from "./api-url";

type Schemas = components["schemas"];
type ErrorBody = Schemas["Error"];

/**
 * An in-memory stand-in for the identity API, typed from the contract and
 * following the rules in docs/spec/identity.md (sessions, PIN lockout, rights).
 * Tests seed it and the dev-only browser mock runs on it. One device: the
 * "cookies" are two fields of this module's state.
 */

type ProfileSummary = Schemas["ProfileSummary"];
type FamilySummary = Schemas["FamilySummary"];

export interface MockProfile extends ProfileSummary {
  pin: string | null;
  failedPins: number;
  contactEmail: string | null;
}

interface MockFamily extends FamilySummary {
  email: string;
  password: string;
}

interface MockState {
  registrationOpen: boolean;
  family: MockFamily | null;
  profiles: MockProfile[];
  /** This device's family session: signed in or not. */
  familySession: boolean;
  /** This device's profile session: the active profile's id. */
  profileSessionId: string | null;
  failedLogins: number;
  /** Mock-only: add example members to a newly registered family (browser demo). */
  addDemoMembers: boolean;
  /** Mock-only: delay every response by this many ms (browser demo). */
  latencyMs: number;
}

export const MOCK_PASSWORD = "correct horse battery";
const LOGIN_FAILURES_BEFORE_LIMIT = 5;
const LOGIN_RETRY_AFTER_SECONDS = 30;
/** PIN lockout per failure count from the 5th on (spec §6.2), in seconds. */
const PIN_LOCKOUT_SECONDS = [30, 60, 300, 900];
const PIN_LOCKOUT_MAX_SECONDS = 3600;
const PIN_FREE_FAILURES = 4;

const PARENT_PERMISSIONS = [
  "family.view",
  "family.edit",
  "family.modules.manage",
  "family.profiles.create",
  "family.profiles.edit",
  "family.profiles.role",
  "family.profiles.delete",
  "family.pins.reset_child",
  "family.sessions.manage",
];
const OWNER_PERMISSIONS = [
  ...PARENT_PERMISSIONS,
  "family.pins.reset_parent",
  "family.account.manage",
];

let nextId = 1;
function newId(): string {
  const n = String(nextId++).padStart(12, "0");
  return `01900000-0000-7000-8000-${n}`;
}

const isoNow = () => new Date().toISOString();

function emptyState(): MockState {
  return {
    registrationOpen: true,
    family: null,
    profiles: [],
    familySession: false,
    profileSessionId: null,
    failedLogins: 0,
    addDemoMembers: false,
    latencyMs: 0,
  };
}

let state = emptyState();

export function mockProfile(overrides: Partial<MockProfile> = {}): MockProfile {
  const now = isoNow();
  return {
    id: newId(),
    name: "Robin",
    role: "PARENT",
    isOwner: false,
    colour: "teal",
    avatar: null,
    timezone: "Europe/London",
    hasPin: overrides.pin != null,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    pin: null,
    failedPins: 0,
    contactEmail: null,
    ...overrides,
  };
}

interface Seed {
  registrationOpen?: boolean;
  /** Profiles of an existing family; the first is the owner. Omit for no family. */
  profiles?: MockProfile[];
  autoLockMinutes?: number;
  signedIn?: boolean;
  /** Name of the active profile; needs `signedIn`. */
  activeProfile?: string;
  addDemoMembers?: boolean;
  latencyMs?: number;
}

/** Test and demo controls for the mock. `reset` runs after every test. */
export const mockApi = {
  reset(seed: Seed = {}) {
    state = emptyState();
    state.registrationOpen = seed.registrationOpen ?? true;
    state.addDemoMembers = seed.addDemoMembers ?? false;
    state.latencyMs = seed.latencyMs ?? 0;
    if (seed.profiles) {
      state.family = {
        id: newId(),
        name: "The Harbours",
        autoLockMinutes: seed.autoLockMinutes ?? 10,
        email: "family@example.com",
        password: MOCK_PASSWORD,
      };
      state.profiles = seed.profiles.map((p, i) => ({ ...p, isOwner: i === 0 }));
    }
    state.familySession = seed.signedIn ?? false;
    const active = state.profiles.find((p) => p.name === seed.activeProfile);
    state.profileSessionId = active?.id ?? null;
  },
  /** The device's sessions, for assertions. */
  get sessions() {
    return { family: state.familySession, profileId: state.profileSessionId };
  },
  profile(name: string): MockProfile {
    const found = state.profiles.find((p) => p.name === name);
    if (!found) throw new Error(`No mock profile named ${name}`);
    return found;
  },
};

/** A standard family: owner parent (no PIN), a parent with PIN 123456, a child. */
export function standardFamily(): MockProfile[] {
  return [
    mockProfile({ name: "Jo", colour: "amber" }),
    mockProfile({ name: "Alex", colour: "sky", pin: "123456" }),
    mockProfile({ name: "Sam", role: "CHILD", colour: "lime", timezone: "Europe/London" }),
  ];
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  extra?: Partial<ErrorBody["error"]>,
) {
  const headers: Record<string, string> = {};
  if (extra?.retryAfterSeconds) headers["Retry-After"] = String(extra.retryAfterSeconds);
  return HttpResponse.json<ErrorBody>({ error: { code, message, ...extra } }, { status, headers });
}

const familyRequired = () =>
  errorResponse(401, "family_session_required", "Sign this device in to your family.");
const profileRequired = () =>
  errorResponse(401, "profile_session_required", "Choose a profile to continue.");

function summary(p: MockProfile): Schemas["ProfileSummary"] {
  const lockedUntil =
    p.lockedUntil && Date.parse(p.lockedUntil) > Date.now() ? p.lockedUntil : null;
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    isOwner: p.isOwner,
    colour: p.colour,
    avatar: p.avatar,
    timezone: p.timezone,
    hasPin: p.pin != null,
    lockedUntil,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function familySummary(f: MockFamily): Schemas["FamilySummary"] {
  return { id: f.id, name: f.name, autoLockMinutes: f.autoLockMinutes };
}

function familySessionBody(f: MockFamily): Schemas["FamilySession"] {
  return { family: familySummary(f), profiles: state.profiles.map(summary) };
}

function me(f: MockFamily, p: MockProfile): Schemas["Me"] {
  const permissions = p.role === "CHILD" ? [] : p.isOwner ? OWNER_PERMISSIONS : PARENT_PERMISSIONS;
  const hasChild = state.profiles.some((x) => x.role === "CHILD");
  return {
    profile: {
      ...summary(p),
      contactEmail: p.contactEmail,
      contactEmailVerifiedAt: null,
    },
    family: familySummary(f),
    permissions,
    modules: [],
    pinAdvised: p.role === "PARENT" && p.pin == null && hasChild,
    session: {
      expiresAt: new Date(Date.now() + 12 * 3600_000).toISOString(),
      idleTimeoutSeconds: 1800,
    },
  };
}

function lockoutSeconds(failures: number): number {
  return PIN_LOCKOUT_SECONDS[failures - PIN_FREE_FAILURES - 1] ?? PIN_LOCKOUT_MAX_SECONDS;
}

function remainingLockSeconds(p: MockProfile): number {
  if (!p.lockedUntil) return 0;
  return Math.max(0, Math.ceil((Date.parse(p.lockedUntil) - Date.now()) / 1000));
}

function demoMembers(): MockProfile[] {
  return [
    mockProfile({ name: "Alex", colour: "sky", pin: "123456" }),
    mockProfile({ name: "Sam", role: "CHILD", colour: "lime" }),
  ];
}

async function latency() {
  if (state.latencyMs > 0) await delay(state.latencyMs);
}

export const identityHandlers = [
  http.get<PathParams, never, Schemas["RegistrationStatus"]>(
    apiUrl("/auth/registration"),
    async () => {
      await latency();
      return HttpResponse.json({ open: state.registrationOpen && state.family === null });
    },
  ),

  http.post<PathParams, Schemas["RegisterRequest"], Schemas["Me"] | ErrorBody>(
    apiUrl("/auth/register"),
    async ({ request }) => {
      await latency();
      if (!state.registrationOpen || state.family) {
        return errorResponse(403, "registration_closed", "Registration is closed.");
      }
      const body = await request.json();
      if (body.email.trim().toLowerCase() === "taken@example.com") {
        return errorResponse(409, "email_taken", "That email already has a family.");
      }
      const family: MockFamily = {
        id: newId(),
        name: body.familyName.trim(),
        autoLockMinutes: 10,
        email: body.email.trim().toLowerCase(),
        password: body.password,
      };
      const owner = mockProfile({
        ...body.owner,
        avatar: body.owner.avatar ?? null,
        isOwner: true,
      });
      state.family = family;
      state.profiles = [owner, ...(state.addDemoMembers ? demoMembers() : [])];
      state.familySession = true;
      state.profileSessionId = owner.id;
      return HttpResponse.json(me(family, owner), { status: 201 });
    },
  ),

  http.post<PathParams, Schemas["LoginRequest"], Schemas["FamilySession"] | ErrorBody>(
    apiUrl("/auth/login"),
    async ({ request }) => {
      await latency();
      if (state.failedLogins >= LOGIN_FAILURES_BEFORE_LIMIT) {
        return errorResponse(429, "rate_limited", "Too many attempts.", {
          retryAfterSeconds: LOGIN_RETRY_AFTER_SECONDS,
        });
      }
      const body = await request.json();
      const family = state.family;
      if (
        !family ||
        body.email.trim().toLowerCase() !== family.email ||
        body.password !== family.password
      ) {
        state.failedLogins += 1;
        return errorResponse(401, "invalid_credentials", "That email and password do not match.");
      }
      state.failedLogins = 0;
      state.familySession = true;
      state.profileSessionId = null;
      return HttpResponse.json(familySessionBody(family));
    },
  ),

  http.post(apiUrl("/auth/logout"), async () => {
    await latency();
    state.familySession = false;
    state.profileSessionId = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get<PathParams, never, Schemas["FamilySession"] | ErrorBody>(
    apiUrl("/auth/session"),
    async () => {
      await latency();
      if (!state.familySession || !state.family) return familyRequired();
      return HttpResponse.json(familySessionBody(state.family));
    },
  ),

  http.get<PathParams, never, Schemas["ProfileList"] | ErrorBody>(apiUrl("/profiles"), async () => {
    await latency();
    if (!state.familySession) return familyRequired();
    return HttpResponse.json({ profiles: state.profiles.map(summary) });
  }),

  http.post<PathParams, Schemas["SelectProfileRequest"], Schemas["Me"] | ErrorBody>(
    apiUrl("/auth/profile-session"),
    async ({ request }) => {
      await latency();
      const family = state.family;
      if (!state.familySession || !family) return familyRequired();
      const body = await request.json();
      const profile = state.profiles.find((p) => p.id === body.profileId);
      if (!profile) return errorResponse(404, "not_found", "No such profile.");

      const locked = remainingLockSeconds(profile);
      if (locked > 0) {
        return errorResponse(429, "pin_locked", "Too many wrong PINs.", {
          retryAfterSeconds: locked,
        });
      }
      if (profile.pin != null && body.pin !== profile.pin) {
        profile.failedPins += 1;
        if (profile.failedPins > PIN_FREE_FAILURES) {
          const seconds = lockoutSeconds(profile.failedPins);
          profile.lockedUntil = new Date(Date.now() + seconds * 1000).toISOString();
          return errorResponse(429, "pin_locked", "Too many wrong PINs.", {
            retryAfterSeconds: seconds,
          });
        }
        return errorResponse(403, "invalid_pin", "That PIN is not right.");
      }
      profile.failedPins = 0;
      profile.lockedUntil = null;
      state.profileSessionId = profile.id;
      return HttpResponse.json(me(family, profile));
    },
  ),

  http.delete(apiUrl("/auth/profile-session"), async () => {
    await latency();
    if (!state.familySession) return familyRequired();
    state.profileSessionId = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get<PathParams, never, Schemas["Me"] | ErrorBody>(apiUrl("/me"), async () => {
    await latency();
    if (!state.familySession || !state.family) return familyRequired();
    const profile = state.profiles.find((p) => p.id === state.profileSessionId);
    if (!profile) return profileRequired();
    return HttpResponse.json(me(state.family, profile));
  }),
];
