-- Baseline. The schema starts empty: identity tables arrive in milestone 3.
-- This adds only the shared trigger function every mutable table will use to
-- keep updated_at honest without relying on each query to set it.

-- +goose Up
-- +goose StatementBegin
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;
-- +goose StatementEnd

-- +goose Down
DROP FUNCTION set_updated_at();
