-- name: DatabaseNow :one
-- DatabaseNow returns the database clock. It proves the sqlc toolchain end to
-- end and is handy for spotting clock skew between app and database.
SELECT now()::timestamptz AS now;
