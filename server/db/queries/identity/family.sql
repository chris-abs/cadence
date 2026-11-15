-- Identity: the family account. Only internal/identity uses these queries.

-- name: LockRegistration :exec
-- LockRegistration serialises registrations for the rest of the transaction,
-- so the "zero families" check in first mode cannot race (spec R10).
SELECT pg_advisory_xact_lock(@key::bigint);

-- name: FamilyExists :one
SELECT EXISTS (SELECT 1 FROM family);

-- name: CreateFamily :one
INSERT INTO family (id, name, email, password_hash)
VALUES (@id, @name, @email, @password_hash)
RETURNING *;

-- name: GetFamily :one
SELECT * FROM family WHERE id = $1;

-- name: GetFamilyForUpdate :one
-- Locks the family row: serialises profile creation against the 20-profile
-- cap and ownership transfers.
SELECT * FROM family WHERE id = $1 FOR UPDATE;

-- name: GetFamilyByEmail :one
SELECT * FROM family WHERE email = $1;

-- name: UpdateFamilySettings :one
UPDATE family SET name = @name, auto_lock_minutes = @auto_lock_minutes
WHERE id = @id
RETURNING *;

-- name: UpdateFamilyEmail :one
UPDATE family SET email = @email WHERE id = @id RETURNING *;

-- name: UpdateFamilyPassword :exec
UPDATE family SET password_hash = @password_hash, password_changed_at = now()
WHERE id = @id;

-- name: DeleteFamily :execrows
DELETE FROM family WHERE id = $1;
