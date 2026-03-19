-- Migration 004: Remove operators feature and operator role
-- Run: psql $DATABASE_URL -f database/migrations/004_remove_operators.sql

UPDATE users
SET role = 'viewer'
WHERE role = 'operator';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'admin', 'viewer'));

DROP INDEX IF EXISTS idx_users_operator_id;
ALTER TABLE users DROP COLUMN IF EXISTS operator_id CASCADE;

DROP INDEX IF EXISTS idx_operators_employee_id;
DROP TRIGGER IF EXISTS trg_operators_updated_at ON operators;
DROP TABLE IF EXISTS operators;
