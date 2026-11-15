# Identity — authentication, authorisation, family and profiles

**Status: Approved by the owner on 2026-11-15 (PLAN.md M3.0).** Implements decisions 0001–0003.
Contract: the `auth`, `family`, `profiles`, `sessions`, `modules` tags in `api/openapi.yaml`.
Owner choices are marked **[I#]** and listed in §9; all were approved with their defaults.

## 1. Summary

A **family account** (one email + password) signs a device in and gets a **family session**.
The device shows a **profile picker**; choosing a profile (with its PIN, if it has one) adds a
**profile session** on top. Everything except signing in and picking a profile needs a profile
session. Each profile is `PARENT` or `CHILD`; exactly one profile is the **owner** (always a
PARENT). What a profile may do is `role × module × action`, read live from the database on
every request, so a demotion or a disabled module takes effect on the next request.

The primary device is a shared kitchen tablet: it stays signed in to the family for months,
and drops back to the picker after a few idle minutes. Phones work the same way.

## 2. Flows

All paths are relative to `/api`. "FS" = family session cookie, "PS" = profile session cookie.

**Register** (only while registration is open, §6.1)
1. Client calls `GET /auth/registration`; if `open` is false it hides "Create a family".
2. Form: email, password, family name; then owner name, colour, timezone (from the browser).
3. `POST /auth/register`. One transaction: create family, owner profile (PARENT, `is_owner`),
   family session, owner profile session. Sets both cookies; client lands in the app as owner.
4. Owner is shown the (dismissible) "add your family" step. No email verification in v1 **[I7]**.

**Log in on the tablet**
1. `POST /auth/login` with email, password, optional `deviceName` ("Kitchen tablet").
2. Success: any FS already on this device is deleted, a new FS is set, response holds the
   family summary and picker profiles. Failure: `401 invalid_credentials`, same for unknown
   email and wrong password (§6.3).

**Pick / switch profile**
1. Picker lists `GET /profiles` (FS, `ProfileSummary`): name, colour, avatar, `hasPin`,
   `lockedUntil`. Never contact emails.
2. No PIN: `POST /auth/profile-session {profileId}` → PS cookie set, `Me` returned.
3. With PIN: client shows the PIN pad, then the same call with `pin`. Wrong PIN →
   `403 invalid_pin`; locked → `429 pin_locked` with `retryAfterSeconds` (§6.2).
4. Switching = picking again: the server replaces this device's PS (one PS per FS).

**Lock back to the picker**
- Manual ("Switch profile" / lock button) or automatic after the family's `autoLockMinutes`
  without a touch (client timer, default 10). Both call `DELETE /auth/profile-session` (FS),
  which deletes this device's PS and clears its cookie. Server idle timeout is the backstop (§3).

**Add / edit / remove a profile** (PARENT)
1. Add: `POST /profiles {name, role, colour, avatar?, timezone?, pin?, contactEmail?}`. Max 20
   profiles.
2. Edit display fields: `PUT /profiles/{id} {name, colour, avatar, timezone, contactEmail}` (full
   replace, so `null` clears `avatar` or `contactEmail` without tri-state JSON) — self for
   anyone, any profile for a PARENT. A changed `contactEmail` resets its verification.
3. Remove: `DELETE /profiles/{id}`; not the owner, not yourself. Cascades its sessions and
   PIN state; module data it authored keeps the row with `created_by = NULL`.

**Change a role** (PARENT): `PUT /profiles/{id}/role {role}`; not self, not the owner. The
target's profile sessions are deleted so its UI reloads with the new rights.

**PIN** — one endpoint, `PUT /profiles/{id}/pin {pin | null, currentPin?, password?}`
(`null` removes the PIN; the key is required, and the handler rejects a body without it with
`422`, because Go decodes a missing key and `null` alike). Proof required, by case:

| Actor → target | Proof |
|---|---|
| Self, no PIN yet | none |
| Self, has PIN | `currentPin` (counts towards lockout), or `password` if actor is a PARENT **[I5]** |
| PARENT → a CHILD | none ("reset") |
| Owner → another PARENT | none |
| Non-owner PARENT → another PARENT or owner | not allowed (`403`) |
| CHILD → anyone else | not allowed (`403`) |

On success: target's PIN lockout cleared; target's profile sessions deleted, except the
actor's own current PS when changing their own PIN.
**PIN advice:** `Me.pinAdvised` is true for a PARENT without a PIN while the family has a
CHILD profile. The client shows a dismissible banner; nothing is forced.

**Change family password** (owner): `PUT /family/password {currentPassword, newPassword}`.
Deletes every session of the family except this device's FS and PS.

**Change family email** (owner): `PUT /family/email {email, password}`. Sessions unchanged.

**Emails.** The family email is the only sign-in and recovery address; it may be any adult's
personal address. A profile's optional **contact email** is for notifications only: never a
credential, not unique, visible to the profile itself and PARENTs (§5.1). Nothing is sent to it
until verified; verification arrives with email sending (not in v1), so v1 stores it unverified.

**Transfer ownership** (owner): `POST /family/owner {profileId, password}` to another PARENT.

**Edit family** (PARENT): `PUT /family {name, autoLockMinutes}`.

**Delete family** (owner): `POST /family/delete {password, confirmName}` where `confirmName`
equals the family name (trimmed, case-insensitive). Immediate, permanent delete **[I1]**:
the `family` row goes and `ON DELETE CASCADE` removes profiles, sessions, PIN state, module
settings and every module table (all carry `family_id … ON DELETE CASCADE`). Both cookies are
cleared on this device; other devices get `401` on their next request. Recovery is only from
the owner's backups (PLAN M5.3). The client asks twice and says this.

**Sign a device out** (PARENT): `GET /auth/sessions` lists family sessions (device name,
user agent, created, last seen, current, active profile name). `DELETE /auth/sessions/{id}`
deletes it and its PS. Deleting the current one clears this device's cookies.
**Sign out everywhere else** (PARENT): `POST /auth/sessions/revoke-others` keeps only this
device. **Log out this device** (any FS): `POST /auth/logout`, idempotent.

## 3. Session model

| | Family session (FS) | Profile session (PS) |
|---|---|---|
| Created by | register, login | register, `POST /auth/profile-session` |
| Cookie (production) | `__Host-cadence_family` | `__Host-cadence_profile` |
| Cookie (dev/test) | `cadence_family` | `cadence_profile` |
| Idle timeout (server) | 30 days, sliding | 30 min, sliding **[I3]** |
| Absolute lifetime | 90 days, then log in again **[I2]** | 12 hours |
| Client auto-lock | — | `family.autoLockMinutes` (1–30, default 10) **[I3]** |
| Per device | one | at most one, bound to that device's FS |
| Accepted by | family middleware only | profile middleware only (also needs the matching FS) |

- **Tokens:** 32 bytes from `crypto/rand`, base64url in the cookie. The DB stores only
  `sha256(token)` (bytea); a DB leak yields no usable cookie. High-entropy tokens need no bcrypt.
- **Cookie attributes:** `HttpOnly; SameSite=Strict; Path=/; Max-Age=<absolute lifetime>`,
  `Secure` everywhere except `APP_ENV=development` (plain-http localhost). No `Domain`, so the
  `__Host-` prefix holds. Logout and expiry answers send `Max-Age=0`.
- **Lookup:** family middleware reads the FS cookie, finds `kind='family'`, unexpired, and
  loads the family. Profile middleware reads the PS cookie, finds `kind='profile'` whose
  `family_session_id` is the session of the FS cookie on the same request, both unexpired, and
  loads profile + role + family in the same query. A PS sent alone, or with another device's
  FS, is rejected. Expired rows found on lookup are deleted.
- **Sliding renewal:** a request on a session pushes `idle_expires_at` out (never past
  `expires_at`), written at most once a minute per session. A PS request renews its FS too.
  Requests with header `X-Cadence-Passive: 1` (background polling, e.g. shopping-list sync)
  never renew, so polling cannot keep a tablet unlocked.
- **Missing/expired:** `401 family_session_required` (client → login) or
  `401 profile_session_required` (client → picker). The two codes are distinct on purpose.
- **Invalidation:**

| Event | Sessions deleted |
|---|---|
| Logout | this FS (+ its PS) |
| Lock / switch profile | this device's PS |
| Password change | all of the family's except this device's FS + PS |
| PIN set/change/remove/reset | target's PSs (actor's own current PS kept on self-change) |
| Role change | target's PSs |
| Profile deleted / family deleted | everything referencing them (FK cascade) |
| Device revoked / revoke-others | that FS / all other FSs, with their PSs |
| Ownership transfer, email change | none |

- **Cleanup:** an hourly goroutine deletes rows past `idle_expires_at` or `expires_at`.
- **CSRF:** cookies are `SameSite=Strict` and API + client share one origin, so browsers do not
  send them on cross-site requests. Defence in depth: wrap `/api` in Go's
  `http.CrossOriginProtection` (rejects non-safe methods whose `Sec-Fetch-Site`/`Origin` is
  cross-origin) with a deny handler that writes `403 cross_origin` in the Error shape, and
  every body-carrying request must be `application/json` (already enforced by `DecodeJSON`).
  No CSRF tokens. If the client is ever hosted on another origin this section is revisited.
- **Login while signed in:** replaces this device's FS. Registering does the same.

## 4. Data model

Conventions as `docs/spec/meals.md` §4: UUIDv7 from Go, `timestamptz` timestamps with
`set_updated_at()` trigger on mutable tables, RLS enabled with no policies, no soft delete.

**`family`**

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text NOT NULL` | `CHECK (char_length(name) BETWEEN 1 AND 60)`; trimmed in Go |
| `email` | `text NOT NULL` | `CHECK (email = lower(email))`; `UNIQUE` (`family_email_key`) |
| `password_hash` | `text NOT NULL` | bcrypt, cost 12 |
| `password_changed_at` | `timestamptz NOT NULL DEFAULT now()` | shown in settings; audit |
| `auto_lock_minutes` | `smallint NOT NULL DEFAULT 10` | `CHECK (auto_lock_minutes BETWEEN 1 AND 30)` |
| `created_at`, `updated_at` | `timestamptz NOT NULL DEFAULT now()` | |

**`profile`**

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | `uuid` | PK; also `UNIQUE (family_id, id)` for composite FKs |
| `family_id` | `uuid NOT NULL` | `REFERENCES family(id) ON DELETE CASCADE` |
| `name` | `text NOT NULL` | `CHECK (char_length(name) BETWEEN 1 AND 40)`; unique per family, see indexes |
| `role` | `text NOT NULL` | `CHECK (role IN ('PARENT','CHILD'))` |
| `is_owner` | `boolean NOT NULL DEFAULT false` | `CHECK (NOT is_owner OR role = 'PARENT')` |
| `colour` | `text NOT NULL` | one of the 22 Tailwind palette names (contract enum `ProfileColour`; validated in Go) |
| `avatar` | `text NULL` | preset key `^[a-z0-9-]{1,32}$`; NULL = initials. Image upload waits for S3 **[I8]** |
| `timezone` | `text NOT NULL` | IANA name, validated with `time.LoadLocation` |
| `pin_hash` | `text NULL` | bcrypt of the 6 digits; NULL = no PIN |
| `contact_email` | `text NULL` | `CHECK (contact_email = lower(contact_email))`; same rules as `family.email` (§6.3); not unique |
| `contact_email_verified_at` | `timestamptz NULL` | NULL = unverified (always in v1); set to NULL whenever `contact_email` changes |
| `created_at`, `updated_at` | `timestamptz NOT NULL DEFAULT now()` | |

Indexes: `CREATE UNIQUE INDEX profile_one_owner ON profile (family_id) WHERE is_owner;` and
`CREATE UNIQUE INDEX profile_family_name ON profile (family_id, lower(name));` (no two
"Sam"s on one picker). "At least one owner" cannot be a constraint; it holds because the
owner can be neither deleted nor demoted, and ownership transfer clears the old owner then
sets the new one in one transaction (that order, so the partial index never sees two).

**`pin_attempt`** — PIN lockout state, separate so failures do not touch `profile.updated_at`.

| Column | Type | Constraints / notes |
|---|---|---|
| `profile_id` | `uuid` | PK, `REFERENCES profile(id) ON DELETE CASCADE` |
| `failed_count` | `integer NOT NULL` | `CHECK (failed_count > 0)` |
| `locked_until` | `timestamptz NULL` | |
| `last_failed_at` | `timestamptz NOT NULL` | |

Row is deleted on a correct PIN and on any PIN set/reset. Written with `SELECT … FOR UPDATE`
on the profile row so parallel guesses cannot skip the counter.

**`session`**

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | `uuid` | PK; exposed as the device id in `GET /auth/sessions` |
| `token_hash` | `bytea NOT NULL` | `UNIQUE`; `CHECK (octet_length(token_hash) = 32)` |
| `kind` | `text NOT NULL` | `CHECK (kind IN ('family','profile'))` |
| `family_id` | `uuid NOT NULL` | `REFERENCES family(id) ON DELETE CASCADE` |
| `profile_id` | `uuid NULL` | `FOREIGN KEY (family_id, profile_id) REFERENCES profile(family_id, id) ON DELETE CASCADE` |
| `family_session_id` | `uuid NULL` | `REFERENCES session(id) ON DELETE CASCADE` |
| `device_name` | `text NULL` | ≤ 60 chars, client-supplied at login |
| `user_agent` | `text NULL` | truncated to 256 |
| `created_at`, `last_seen_at` | `timestamptz NOT NULL DEFAULT now()` | |
| `idle_expires_at`, `expires_at` | `timestamptz NOT NULL` | `CHECK (idle_expires_at <= expires_at)` |

Shape check: `CHECK ((kind = 'family' AND profile_id IS NULL AND family_session_id IS NULL) OR
(kind = 'profile' AND profile_id IS NOT NULL AND family_session_id IS NOT NULL))`.
Indexes: `UNIQUE (family_session_id) WHERE kind = 'profile'` (one PS per device; selecting a
profile deletes then inserts in one transaction); `(family_id)`; `(profile_id)`; `(expires_at)`.
No IP column: the rate limiter needs IPs only in memory, and a family app need not keep them.

**`family_module`** — only families that changed a module's default have a row.

| Column | Type | Constraints / notes |
|---|---|---|
| `family_id` | `uuid NOT NULL` | `REFERENCES family(id) ON DELETE CASCADE` |
| `module_id` | `text NOT NULL` | `CHECK (module_id ~ '^[a-z][a-z0-9_]{1,31}$')`; no FK, the catalogue is code |
| `enabled` | `boolean NOT NULL` | |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | |

PK `(family_id, module_id)`. Effective state = row's `enabled`, else the module's
`DefaultEnabled` from code. Rows for modules no longer in code are ignored.

## 5. Authorisation

### 5.1 Identity actions (fixed in code, never overridable)

✓ allowed · ✗ `403 forbidden` · "self" = only on own profile. All need a PS unless marked FS.

| Action | Endpoint | CHILD | PARENT | Owner |
|---|---|---|---|---|
| List picker profiles (FS) | `GET /profiles` | ✓ | ✓ | ✓ |
| Select profile / lock (FS) | `POST`, `DELETE /auth/profile-session` | ✓ | ✓ | ✓ |
| Current profile, rights | `GET /me` | ✓ | ✓ | ✓ |
| View a profile | `GET /profiles/{id}` | ✓ | ✓ | ✓ |
| See a profile's contact email | `Profile.contactEmail*` in any response | self | ✓ | ✓ |
| Edit display fields, contact email | `PUT /profiles/{id}` | self | ✓ | ✓ |
| Create profile (any role) | `POST /profiles` | ✗ | ✓ | ✓ |
| Change role | `PUT /profiles/{id}/role` | ✗ | ✓ not self, not owner | ✓ not self |
| Delete profile | `DELETE /profiles/{id}` | ✗ | ✓ not self, not owner | ✓ not self |
| Set/remove own PIN | `PUT /profiles/{id}/pin` | self | self | self |
| Reset a CHILD's PIN | same | ✗ | ✓ | ✓ |
| Reset another PARENT's PIN | same | ✗ | ✗ | ✓ |
| View family (incl. email) | `GET /family` | ✗ | ✓ | ✓ |
| Edit family name, auto-lock | `PUT /family` | ✗ | ✓ | ✓ |
| List modules | `GET /modules` | ✓ | ✓ | ✓ |
| Enable/disable a module | `PUT /modules/{id}` | ✗ | ✓ | ✓ |
| List / revoke devices | `GET`, `DELETE /auth/sessions…`, `revoke-others` | ✗ | ✓ | ✓ |
| Change email / password, transfer, delete family | `/family/email`, `/password`, `/owner`, `/delete` | ✗ | ✗ | ✓ **[I4]** |

Contact email visibility: `ProfileSummary` (picker, FS) never carries it. `Profile` carries
`contactEmail` and `contactEmailVerifiedAt`, set to null when the caller is neither that profile
nor a PARENT, so a CHILD cannot tell whether another profile has one.

`Me.permissions` lists the identity rights as strings so the client never re-derives them:
`family.view`, `family.edit`, `family.modules.manage`, `family.profiles.create`,
`family.profiles.edit`, `family.profiles.role`, `family.profiles.delete`,
`family.pins.reset_child`, `family.pins.reset_parent`, `family.sessions.manage`,
`family.account.manage`. The server checks the same strings via `authz.Can`.

### 5.2 Module permissions

- **Catalogue in code.** Each module package exports one value:
  `authz.Module{ID: "meals", Name, Description, DefaultEnabled: true, Actions: []authz.Action{
  {ID: "recipes.edit", Roles: []Role{Parent}}, {ID: "shopping.tick", Roles: []Role{Parent, Child}}, …}}`
  registered in `app.NewHandler`. A permission is the string `<module>.<action>`; module ids
  match `family_module.module_id`. Adding calendar or to-dos = a new package + one register
  call; no migration, no contract change for the catalogue (`ModuleId` is a string, not an enum).
- **v1 catalogue:** `meals` only (actions owned by `meals.md` §3). Legacy's storage, chores,
  media, services are not listed until built.
- **Check:** module routes are wrapped `requireModule("meals")` (→ `403 module_disabled` if
  off) and handlers call `authz.Require(ctx, "meals.recipes.edit")` (→ `403 forbidden`).
  `Can(profile, perm) = moduleEnabled(family, module) AND roleGrants(module, action, role)`.
  Enablement is read per request (one PK lookup); the role comes from the session query.
- **`Me.permissions`** includes every granted `<module>.<action>` of enabled modules, so the
  client hides controls with the same data the server enforces.
- **Per-profile overrides — deferred** **[I6]**. Growth path: a `profile_grant(profile_id,
  permission, effect 'allow'|'deny')` table, and `Can` becomes role default + allows − denies.
  Only module permissions can be overridden; `family.*` never, so an override cannot become a
  route to escalation. Only `Can` and the management UI change; callers do not.

### 5.3 Rules that close the legacy holes

| # | Rule | Legacy bug prevented |
|---|---|---|
| R1 | FS and PS are different `kind`s; each middleware accepts only its own kind; there is no endpoint that mints a session from a PS | Token confusion; endless renewal via `/profiles/select` |
| R2 | A PS is valid only alongside the FS it was created under | Replaying a PS on another device |
| R3 | Role, owner flag and module state are read from the DB on every request; nothing is cached in the cookie | Demoted/deleted profiles keeping rights |
| R4 | Creating a profile needs `family.profiles.create` (PARENT PS); CHILD gets 403 | Child creating a PARENT |
| R5 | Role change: actor ≠ target, target ≠ owner, actor is PARENT | Self escalation / demoting the owner |
| R6 | Delete: actor ≠ target, target ≠ owner; owner always PARENT ⇒ ≥1 PARENT always exists | Last parent / owner removal |
| R7 | Every `{profileId}`/`{sessionId}` is looked up with `family_id = session family`; misses → `404 not_found`, never 403 | Cross-family access and id probing |
| R8 | `is_owner` is never accepted from a client; set only by register and transfer | Owner forgery; "first profile = owner" race |
| R9 | Request bodies reject unknown fields (`DecodeJSON`), so `role`/`isOwner` cannot ride along on `PUT /profiles/{id}` | Mass assignment |
| R10 | Registration in one transaction under `pg_advisory_xact_lock` | Half-created families; two "first" families |

## 6. Security controls

### 6.1 Registration
`ALLOW_REGISTRATION` = `first` (default: open only while there are zero families), `open`, or
`closed`. Closed → `403 registration_closed`. The "zero families" check runs inside the
registration transaction under the advisory lock.

### 6.2 Limits and lockout (in-memory limiters with `x/time/rate`; one instance)

| Target | Limit | On exceed |
|---|---|---|
| `POST /auth/login` per IP | 10 / 5 min, burst 5 | `429 rate_limited` + `Retry-After` |
| `POST /auth/login` per email (failed only) | 10 / 15 min | same; also hit for unknown emails |
| `POST /auth/register` per IP | 3 / hour | same |
| Password re-auth (email, password, owner, delete, PIN via password) per family | 5 failures / 15 min | same |
| `POST /auth/profile-session` per FS | 30 / min | same (blunts scripted picker abuse) |
| PIN per profile (DB, survives restarts) | failures 1–4 free; 5th → 30 s; 6th → 1 min; 7th → 5 min; 8th → 15 min; 9th+ → 1 h each | `429 pin_locked` + `retryAfterSeconds` |

PIN lockout is checked before bcrypt. Wrong `currentPin` on `PUT …/pin` counts too. Lockout is
per profile, not per device: a child on a phone cannot bypass it. A parent reset clears it.
IP = `RemoteAddr`; `X-Forwarded-For` only when `TRUSTED_PROXY` is configured (hosting, M5).

### 6.3 Input and enumeration
- Email (family and contact): trimmed, lower-cased, ≤ 254, must parse with `net/mail` as a bare
  address. An empty contact email is rejected (`422`); clearing it is `null`.
- Password: 10–72 characters and ≤ 72 bytes UTF-8 (bcrypt's limit; reject, never truncate).
- PIN: exactly 6 ASCII digits. Names: trimmed, 1–40 (profile) / 1–60 (family), no control chars.
- Validation failures: `422 validation_failed` with `fields` (e.g. `{"password": "Use at least
  10 characters."}`). Malformed JSON stays `400 invalid_request`.
- Login: unknown email runs bcrypt against a fixed dummy hash, so timing and response
  (`401 invalid_credentials`) match a wrong password.
- Register with a taken email: `409 email_taken` **[I9]** — an accepted leak, since
  registration is normally closed and rate limited; hiding it needs email verification.
- Picker data (`GET /profiles`) is visible to anyone holding the FS: by design on a family tablet.
  It therefore holds no contact emails.

### 6.4 Audit events
`slog` at INFO with `event=<name>`, `family_id`, `profile_id`/`actor_id`, `session_id`; never
emails, passwords, PINs or tokens. No audit table in v1 **[I10]**.
`family.registered`, `auth.login_succeeded`, `auth.login_failed` (with reason
`unknown_email|bad_password`, no email), `auth.rate_limited`, `auth.logout`,
`session.revoked`, `session.revoked_others`, `profile.selected`, `profile.pin_failed`,
`profile.pin_locked`, `profile.pin_changed` (`by=self|parent|owner`), `profile.created`,
`profile.role_changed`, `profile.deleted`, `family.password_changed`, `family.email_changed`,
`family.owner_transferred`, `family.module_toggled`, `family.deleted`, `auth.cross_origin_blocked`.

## 7. Error codes (stable, in `Error.error.code`)

| Status | Code | When |
|---|---|---|
| 400 | `invalid_request` | malformed JSON, unknown field |
| 401 | `family_session_required` / `profile_session_required` | missing, expired or wrong-kind cookie |
| 401 | `invalid_credentials` | login failed |
| 403 | `forbidden` | role lacks the right (§5.1) |
| 403 | `invalid_pin`, `invalid_password` | wrong proof on select / PIN / re-auth |
| 403 | `module_disabled`, `registration_closed`, `cross_origin` | |
| 404 | `not_found` | unknown or other family's id; unknown module |
| 409 | `email_taken`, `owner_protected`, `self_not_allowed`, `name_taken`, `profile_limit_reached` | |
| 415 / 413 | `unsupported_media_type` / `request_too_large` | |
| 422 | `validation_failed` | per-field messages in `fields` |
| 429 | `rate_limited`, `pin_locked` | `retryAfterSeconds` set, `Retry-After` header |

## 8. Test plan

**Matrix test** (`internal/identity/authz_test.go`, through the real router): a table of every
endpoint × actor `{no cookie, FS only, PS only (no FS), PS + other device's FS, CHILD, PARENT,
owner, PARENT of another family}` × target where relevant `{self, CHILD, PARENT, owner, other
family's profile}` → expected status and code. One row per cell in §5.1; adding an endpoint
without rows fails a coverage check that walks the registered routes.

**Abuse cases that must have a test**
1. PS cookie on every FS-only route and FS cookie on every PS route → 401 (R1).
2. PS with another device's FS, or alone → 401 (R2). Expired idle / absolute FS and PS → 401.
3. `X-Cadence-Passive: 1` requests do not move `idle_expires_at`.
4. CHILD: create profile, change any role (incl. own), delete, reset another PIN → 403.
5. PARENT: change own role, change owner's role, delete self, delete owner → 409.
6. `PUT /profiles/{id}` with `role` or `isOwner` in the body → 400 (R9).
7. Cross-family profile/session ids on every `{id}` route → 404 (R7).
8. Demoted PARENT's existing PS loses rights on the next request (R3); deleted profile → 401.
9. PIN: lockout schedule, `Retry-After`, parallel wrong guesses counted exactly once each,
   reset clears lockout, lockout survives a server restart (row in DB).
10. Password change / PIN change / role change delete exactly the sessions in §3's table.
11. Login: unknown email and wrong password give identical status, code and body.
12. Rate limits → 429 after the limit; register closed in `first` mode once a family exists;
    two concurrent first registrations → exactly one succeeds.
13. DB constraints: second owner, CHILD owner, duplicate email (case), duplicate profile name
    (case), PS without FS, PS for another family's profile → constraint errors.
14. Delete family: wrong password / wrong name → 403/422, nothing deleted; success → all
    family rows gone (count every table) and other devices get 401.
15. Cross-origin POST (`Sec-Fetch-Site: cross-site`) → 403 `cross_origin`.
16. Disabled module route → 403 `module_disabled`; re-enabled → allowed.
17. Password of 73 bytes (multibyte) → 422; never truncated.
18. Contact email visibility: absent from `GET /profiles` and `GET /auth/session`; on `GET
    /profiles/{id}`, `Me` and write responses filled for self and PARENT, null for a CHILD
    viewing another profile.
19. Contact email input: `" Sam@Example.COM "` stored as `sam@example.com`; invalid, empty or
    255-char → 422; two profiles (or a profile and the family) may share one; CHILD setting
    another profile's → 403; a change resets `contact_email_verified_at`; `null` clears it.

Client (M4): MSW handlers per endpoint; picker with/without PIN, lockout countdown, auto-lock
timer, 401 code routing (login vs picker), parent-only controls absent for a CHILD.

## 9. Owner decisions (approved 2026-11-15 with these defaults)

| # | Question | Default | If you choose otherwise | Cost to change later |
|---|---|---|---|---|
| I1 | Delete family: immediate or 7-day grace? | Immediate, after password + typing the name | Grace: a `deletion_scheduled_at` column, all sessions revoked, login offers "cancel deletion", plus a purge job (none exists yet) | Medium: column + job, no data change |
| I2 | Family session lifetime on the tablet | 30 d idle, 90 d absolute | Longer/no absolute: fewer re-logins, longer exposure if the tablet walks off | Trivial (constants) |
| I3 | Auto-lock to picker | Family setting, default 10 min (1–30); server backstop 30 min. One setting for all profiles, PIN-less ones included (they just return to the picker) | "Never" option for families without children; per-profile timeout | Low |
| I4 | Who manages the account (email, password, ownership, delete) | Owner only | Any PARENT: drop four matrix cells | Trivial |
| I5 | May any PARENT reset their own forgotten PIN with the family password? | Yes | Owner only: other parents ask the owner | Trivial |
| I6 | Per-profile permission overrides in v1? | Deferred; model ready (§5.2) | In v1: one table, `Can` change, a settings screen | Low now, low later |
| I7 | No email verification / no "forgot password" in v1 (no SES yet) | Forgotten password = operator resets it via a server CLI command (added in M3) | Email reset needs SES, a token table and two screens | Medium, additive |
| I8 | Avatar = preset key, not uploaded photo, until S3 | Preset | Photos now pulls S3 forward | Low: column already a string |
| I9 | Register with a taken email says so (409) | Says so | Generic success + email requires SES | Low |
| I10 | Audit trail: logs only, no table | Logs | `audit_event` table + parent-visible history | Low, additive |
| I11 | Unique profile names per family (case-insensitive) | Yes | Allow duplicates; picker relies on colour/avatar | Low (drop index) |
