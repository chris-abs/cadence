-- Identity: per-family module settings. Read once per profile-session request
-- (primary-key prefix scan); the catalogue itself is code.

-- name: ListFamilyModules :many
SELECT module_id, enabled FROM family_module WHERE family_id = $1;

-- name: SetFamilyModule :exec
INSERT INTO family_module (family_id, module_id, enabled)
VALUES (@family_id, @module_id, @enabled)
ON CONFLICT (family_id, module_id) DO UPDATE SET enabled = EXCLUDED.enabled;
