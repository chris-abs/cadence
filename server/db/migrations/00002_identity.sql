-- Identity core: the family account, its profiles, PIN lockout state, device
-- and profile sessions, and per-family module settings (docs/spec/identity.md §4).
-- Ids are UUIDv7 generated in Go. RLS is enabled with no policies so the
-- hosted Data API sees nothing; the API connects as the table owner.

-- +goose Up
CREATE TABLE family (
    id                  uuid PRIMARY KEY,
    name                text NOT NULL CONSTRAINT family_name_length CHECK (char_length(name) BETWEEN 1 AND 60),
    email               text NOT NULL CONSTRAINT family_email_lower CHECK (email = lower(email)),
    password_hash       text NOT NULL,
    password_changed_at timestamptz NOT NULL DEFAULT now(),
    auto_lock_minutes   smallint NOT NULL DEFAULT 10
        CONSTRAINT family_auto_lock_range CHECK (auto_lock_minutes BETWEEN 1 AND 30),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT family_email_key UNIQUE (email)
);
CREATE TRIGGER family_set_updated_at BEFORE UPDATE ON family
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE family ENABLE ROW LEVEL SECURITY;

CREATE TABLE profile (
    id                        uuid PRIMARY KEY,
    family_id                 uuid NOT NULL REFERENCES family (id) ON DELETE CASCADE,
    name                      text NOT NULL CONSTRAINT profile_name_length CHECK (char_length(name) BETWEEN 1 AND 40),
    role                      text NOT NULL CONSTRAINT profile_role_valid CHECK (role IN ('PARENT', 'CHILD')),
    is_owner                  boolean NOT NULL DEFAULT false
        CONSTRAINT profile_owner_is_parent CHECK (NOT is_owner OR role = 'PARENT'),
    colour                    text NOT NULL,
    avatar                    text NULL CONSTRAINT profile_avatar_key CHECK (avatar ~ '^[a-z0-9-]{1,32}$'),
    timezone                  text NOT NULL,
    pin_hash                  text NULL,
    contact_email             text NULL CONSTRAINT profile_contact_email_lower CHECK (contact_email = lower(contact_email)),
    contact_email_verified_at timestamptz NULL,
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    -- Target of composite foreign keys, so a row can only point at a profile
    -- of its own family.
    CONSTRAINT profile_family_id_key UNIQUE (family_id, id)
);
-- Exactly one owner per family: "at most one" is this index; "at least one"
-- holds because the owner can be neither deleted nor demoted.
CREATE UNIQUE INDEX profile_one_owner ON profile (family_id) WHERE is_owner;
-- No two "Sam"s on one picker.
CREATE UNIQUE INDEX profile_family_name ON profile (family_id, lower(name));
CREATE TRIGGER profile_set_updated_at BEFORE UPDATE ON profile
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

-- PIN lockout state lives apart from profile so failed guesses do not touch
-- profile.updated_at. Writers lock the profile row first (SELECT … FOR UPDATE).
CREATE TABLE pin_attempt (
    profile_id     uuid PRIMARY KEY REFERENCES profile (id) ON DELETE CASCADE,
    failed_count   integer NOT NULL CONSTRAINT pin_attempt_count_positive CHECK (failed_count > 0),
    locked_until   timestamptz NULL,
    last_failed_at timestamptz NOT NULL
);
ALTER TABLE pin_attempt ENABLE ROW LEVEL SECURITY;

-- One table for both session kinds; the shape check keeps them apart. Only
-- sha256(token) is stored, so a database leak yields no usable cookie.
CREATE TABLE session (
    id                uuid PRIMARY KEY,
    token_hash        bytea NOT NULL CONSTRAINT session_token_hash_length CHECK (octet_length(token_hash) = 32),
    kind              text NOT NULL CONSTRAINT session_kind_valid CHECK (kind IN ('family', 'profile')),
    family_id         uuid NOT NULL REFERENCES family (id) ON DELETE CASCADE,
    profile_id        uuid NULL,
    family_session_id uuid NULL REFERENCES session (id) ON DELETE CASCADE,
    device_name       text NULL CONSTRAINT session_device_name_length CHECK (char_length(device_name) <= 60),
    user_agent        text NULL CONSTRAINT session_user_agent_length CHECK (char_length(user_agent) <= 256),
    created_at        timestamptz NOT NULL DEFAULT now(),
    last_seen_at      timestamptz NOT NULL DEFAULT now(),
    idle_expires_at   timestamptz NOT NULL,
    expires_at        timestamptz NOT NULL,
    CONSTRAINT session_token_hash_key UNIQUE (token_hash),
    CONSTRAINT session_idle_within_absolute CHECK (idle_expires_at <= expires_at),
    CONSTRAINT session_kind_shape CHECK (
        (kind = 'family' AND profile_id IS NULL AND family_session_id IS NULL)
        OR (kind = 'profile' AND profile_id IS NOT NULL AND family_session_id IS NOT NULL)
    ),
    CONSTRAINT session_profile_fkey FOREIGN KEY (family_id, profile_id)
        REFERENCES profile (family_id, id) ON DELETE CASCADE
);
-- At most one profile session per device; selecting a profile deletes then
-- inserts in one transaction.
CREATE UNIQUE INDEX session_one_profile_per_device ON session (family_session_id) WHERE kind = 'profile';
CREATE INDEX session_family_id_idx ON session (family_id);
CREATE INDEX session_profile_id_idx ON session (profile_id);
CREATE INDEX session_expires_at_idx ON session (expires_at);
ALTER TABLE session ENABLE ROW LEVEL SECURITY;

-- Only families that changed a module's default have a row. The catalogue is
-- code, so module_id has no foreign key; rows for removed modules are ignored.
CREATE TABLE family_module (
    family_id  uuid NOT NULL REFERENCES family (id) ON DELETE CASCADE,
    module_id  text NOT NULL CONSTRAINT family_module_id_format CHECK (module_id ~ '^[a-z][a-z0-9_]{1,31}$'),
    enabled    boolean NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (family_id, module_id)
);
CREATE TRIGGER family_module_set_updated_at BEFORE UPDATE ON family_module
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE family_module ENABLE ROW LEVEL SECURITY;

-- +goose Down
DROP TABLE family_module;
DROP TABLE session;
DROP TABLE pin_attempt;
DROP TABLE profile;
DROP TABLE family;
