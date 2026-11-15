-- name: FamilyExists :one
SELECT EXISTS (SELECT 1 FROM family);

-- name: CreateFamily :one
INSERT INTO family (id, name, email, password_hash)
VALUES (@id, @name, @email, @password_hash)
RETURNING *;

-- name: GetFamily :one
SELECT * FROM family WHERE id = $1;

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

-- name: DeleteFamily :exec
DELETE FROM family WHERE id = $1;

-- name: ListFamilyModules :many
SELECT module_id, enabled FROM family_module WHERE family_id = $1;

-- name: SetFamilyModule :exec
INSERT INTO family_module (family_id, module_id, enabled)
VALUES (@family_id, @module_id, @enabled)
ON CONFLICT (family_id, module_id) DO UPDATE SET enabled = EXCLUDED.enabled;
