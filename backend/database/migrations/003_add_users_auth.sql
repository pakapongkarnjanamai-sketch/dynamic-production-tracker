-- Migration 003: Add users/auth tables and missing tray due_date support
-- Run: psql $DATABASE_URL -f database/migrations/003_add_users_auth.sql

ALTER TABLE trays
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    employee_id    VARCHAR(40)  NOT NULL UNIQUE,
    name           VARCHAR(120) NOT NULL,
    password_hash  TEXT         NOT NULL,
    role           VARCHAR(20)  NOT NULL
                               CHECK (role IN ('superadmin','admin','operator','viewer')),
    operator_id    INTEGER      UNIQUE REFERENCES operators(id) ON DELETE SET NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_operator_id ON users(operator_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_users_updated_at'
    ) THEN
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END;
$$;
