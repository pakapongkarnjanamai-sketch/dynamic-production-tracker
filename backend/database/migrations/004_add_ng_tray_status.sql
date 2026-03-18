-- Migration 004: Allow NG as a terminal tray status
-- Run: psql $DATABASE_URL -f database/migrations/004_add_ng_tray_status.sql

ALTER TABLE trays
  DROP CONSTRAINT IF EXISTS trays_status_check;

ALTER TABLE trays
  ADD CONSTRAINT trays_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'ng'));
