-- name: LockRegistration :exec
SELECT pg_advisory_xact_lock(@key::bigint);

-- name: CreateSession :exec
INSERT INTO session (id, token_hash, kind, family_id, profile_id, family_session_id,
                     device_name, user_agent, created_at, last_seen_at, idle_expires_at, expires_at)
VALUES (@id, @token_hash, @kind, @family_id, sqlc.narg(profile_id), sqlc.narg(family_session_id),
        sqlc.narg(device_name), sqlc.narg(user_agent), @now, @now, @idle_expires_at, @expires_at);

-- name: GetFamilySession :one
SELECT sqlc.embed(s), sqlc.embed(f)
FROM session s
JOIN family f ON f.id = s.family_id
WHERE s.token_hash = $1 AND s.kind = 'family';

-- name: GetProfileSession :one
SELECT sqlc.embed(ps), sqlc.embed(p), sqlc.embed(f),
       fs.last_seen_at AS device_last_seen_at,
       fs.idle_expires_at AS device_idle_expires_at,
       fs.expires_at AS device_expires_at,
       a.locked_until AS pin_locked_until
FROM session ps
JOIN session fs ON fs.id = ps.family_session_id AND fs.kind = 'family' AND fs.token_hash = @family_token_hash
JOIN profile p ON p.family_id = ps.family_id AND p.id = ps.profile_id
JOIN family f ON f.id = ps.family_id
LEFT JOIN pin_attempt a ON a.profile_id = p.id
WHERE ps.token_hash = @profile_token_hash AND ps.kind = 'profile';

-- name: TouchSession :exec
UPDATE session SET last_seen_at = @now, idle_expires_at = @idle_expires_at WHERE id = @id;

-- name: DeleteSession :exec
DELETE FROM session WHERE id = $1;

-- name: DeleteFamilySessionByToken :many
DELETE FROM session WHERE token_hash = $1 AND kind = 'family'
RETURNING id, family_id;

-- name: DeleteDeviceProfileSession :exec
DELETE FROM session WHERE family_session_id = $1 AND kind = 'profile';

-- name: DeleteProfileSessionsOf :exec
DELETE FROM session
WHERE profile_id = @profile_id AND kind = 'profile' AND family_id = @family_id
  AND id <> ALL(@keep::uuid[]);

-- name: DeleteFamilySessionsExcept :exec
DELETE FROM session WHERE family_id = @family_id AND id <> ALL(@keep::uuid[]);

-- name: DeleteDevice :execrows
DELETE FROM session WHERE family_id = @family_id AND id = @id AND kind = 'family';

-- name: DeleteOtherDevices :execrows
DELETE FROM session WHERE family_id = @family_id AND kind = 'family' AND id <> @keep;

-- name: ListDevices :many
SELECT fs.id, fs.device_name, fs.user_agent, fs.created_at, fs.last_seen_at,
       p.id AS active_profile_id, p.name AS active_profile_name
FROM session fs
LEFT JOIN session ps ON ps.family_session_id = fs.id AND ps.kind = 'profile'
    AND ps.idle_expires_at > @now AND ps.expires_at > @now
LEFT JOIN profile p ON p.id = ps.profile_id
WHERE fs.family_id = @family_id AND fs.kind = 'family'
  AND fs.idle_expires_at > @now AND fs.expires_at > @now
ORDER BY fs.last_seen_at DESC, fs.id
LIMIT 100;

-- name: DeleteExpiredSessions :execrows
DELETE FROM session WHERE idle_expires_at <= @now OR expires_at <= @now;
