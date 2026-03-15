#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

psql "$DATABASE_URL" -f "$PROJECT_ROOT/database/schema.sql"
psql "$DATABASE_URL" -f "$PROJECT_ROOT/database/migrations/001_add_tray_timestamps.sql"
psql "$DATABASE_URL" -f "$PROJECT_ROOT/database/migrations/002_add_tray_due_date.sql"
psql "$DATABASE_URL" -f "$PROJECT_ROOT/database/migrations/003_add_users_auth.sql"

echo "Database schema and migrations applied successfully."
