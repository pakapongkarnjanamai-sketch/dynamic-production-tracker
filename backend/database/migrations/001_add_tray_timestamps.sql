-- Migration 001: Add started_at and finished_at to trays
-- Run: psql $DATABASE_URL -f database/migrations/001_add_tray_timestamps.sql

ALTER TABLE trays
  ADD COLUMN IF NOT EXISTS started_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

-- Backfill: started_at = earliest log for each tray
UPDATE trays
SET started_at = (
  SELECT MIN(logged_at)
    FROM production_logs
   WHERE tray_id = trays.id
)
WHERE started_at IS NULL;

-- Backfill: finished_at = latest 'finish' log when tray is completed
UPDATE trays
SET finished_at = (
  SELECT MAX(logged_at)
    FROM production_logs
   WHERE tray_id = trays.id
     AND action  = 'finish'
)
WHERE status = 'completed'
  AND finished_at IS NULL;
