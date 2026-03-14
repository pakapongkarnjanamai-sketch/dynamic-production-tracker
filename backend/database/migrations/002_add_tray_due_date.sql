-- Migration 002: Add due_date column to trays table
-- Run: psql $DATABASE_URL -f database/migrations/002_add_tray_due_date.sql

ALTER TABLE trays
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

COMMENT ON COLUMN trays.due_date IS 'กำหนดส่งงาน — ถ้า due_date < NOW() และ status ≠ completed ถือว่า Delay';
