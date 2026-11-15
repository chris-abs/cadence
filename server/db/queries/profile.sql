-- Identity: profiles and PIN lockout state. Every lookup is scoped by
-- family_id so another family's id is simply not found (spec R7).

-- name: CreateProfile :one
INSERT INTO profile (id, family_id, name, role, is_owner, colour, avatar, timezone, pin_hash, contact_email)
VALUES (@id, @family_id, @name, @role, @is_owner, @colour, sqlc.narg(avatar), @timezone,
        sqlc.narg(pin_hash), sqlc.narg(contact_email))
RETURNING *;

-- name: ListProfiles :many
-- The picker: owner first, then by name. Bounded by the 20-profile cap.
SELECT sqlc.embed(p), a.locked_until
FROM profile p
LEFT JOIN pin_attempt a ON a.profile_id = p.id
WHERE p.family_id = $1
ORDER BY p.is_owner DESC, lower(p.name), p.id;

-- name: GetProfile :one
SELECT sqlc.embed(p), a.locked_until
FROM profile p
LEFT JOIN pin_attempt a ON a.profile_id = p.id
WHERE p.family_id = @family_id AND p.id = @id;

-- name: GetProfileForUpdate :one
-- Locks the profile row so concurrent PIN guesses are counted one at a time.
SELECT sqlc.embed(p), a.failed_count, a.locked_until
FROM profile p
LEFT JOIN pin_attempt a ON a.profile_id = p.id
WHERE p.family_id = @family_id AND p.id = @id
FOR UPDATE OF p;

-- name: CountProfiles :one
SELECT count(*) FROM profile WHERE family_id = $1;

-- name: FamilyHasChild :one
SELECT EXISTS (SELECT 1 FROM profile WHERE family_id = $1 AND role = 'CHILD');

-- name: UpdateProfileDisplay :one
-- A changed contact email loses its verification (all right-hand sides read
-- the old row, so the CASE compares against the previous address).
UPDATE profile SET
    name = @name,
    colour = @colour,
    avatar = sqlc.narg(avatar),
    timezone = @timezone,
    contact_email = sqlc.narg(contact_email),
    contact_email_verified_at = CASE
        WHEN contact_email IS DISTINCT FROM sqlc.narg(contact_email) THEN NULL
        ELSE contact_email_verified_at
    END
WHERE family_id = @family_id AND id = @id
RETURNING *;

-- name: UpdateProfileRole :one
UPDATE profile SET role = @role WHERE family_id = @family_id AND id = @id RETURNING *;

-- name: SetProfilePin :exec
UPDATE profile SET pin_hash = sqlc.narg(pin_hash) WHERE family_id = @family_id AND id = @id;

-- name: DeleteProfile :exec
DELETE FROM profile WHERE family_id = @family_id AND id = @id;

-- name: ClearOwner :exec
-- Ownership transfer clears the old owner before setting the new one, so the
-- profile_one_owner index never sees two.
UPDATE profile SET is_owner = false WHERE family_id = $1 AND is_owner;

-- name: SetOwner :exec
UPDATE profile SET is_owner = true WHERE family_id = @family_id AND id = @id;

-- name: RecordPinFailure :one
INSERT INTO pin_attempt (profile_id, failed_count, last_failed_at)
VALUES (@profile_id, 1, @now)
ON CONFLICT (profile_id) DO UPDATE
SET failed_count = pin_attempt.failed_count + 1, last_failed_at = EXCLUDED.last_failed_at
RETURNING failed_count;

-- name: LockPin :exec
UPDATE pin_attempt SET locked_until = @locked_until WHERE profile_id = @profile_id;

-- name: ClearPinAttempts :exec
DELETE FROM pin_attempt WHERE profile_id = $1;
