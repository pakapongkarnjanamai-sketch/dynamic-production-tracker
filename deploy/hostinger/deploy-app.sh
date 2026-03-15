#!/usr/bin/env bash
set -euo pipefail

# Run as deploy user (not root).
# Required env:
#   REPO_URL
# Optional env:
#   APP_DIR (default: /srv/dynamic-production-tracker)
#   BACKEND_PORT (default: 4000)

REPO_URL="${REPO_URL:-}"
APP_DIR="${APP_DIR:-/srv/dynamic-production-tracker}"
BACKEND_PORT="${BACKEND_PORT:-4000}"
DB_NAME="${DB_NAME:-lite_mes}"
DB_USER="${DB_USER:-lite_mes}"
DB_PASSWORD="${DB_PASSWORD:-change-this-db-password}"
JWT_SECRET="${JWT_SECRET:-change-this-jwt-secret}"
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-}"
SERVER_IP="$(hostname -I | awk '{print $1}')"
if [[ -n "$DEPLOY_DOMAIN" ]]; then
  ALLOWED_ORIGINS_DEFAULT="https://${DEPLOY_DOMAIN},https://www.${DEPLOY_DOMAIN},http://${DEPLOY_DOMAIN},http://www.${DEPLOY_DOMAIN}"
else
  ALLOWED_ORIGINS_DEFAULT="http://${SERVER_IP},https://${SERVER_IP}"
fi
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-$ALLOWED_ORIGINS_DEFAULT}"
SUPERADMIN_EMPLOYEE_ID="${SUPERADMIN_EMPLOYEE_ID:-ADMIN-0001}"
SUPERADMIN_NAME="${SUPERADMIN_NAME:-Administrator}"
SUPERADMIN_PASSWORD="${SUPERADMIN_PASSWORD:-change-me-now}"

if [[ -z "$REPO_URL" ]]; then
  echo "REPO_URL is required" >&2
  exit 1
fi

if [[ "$(id -u)" -eq 0 ]]; then
  echo "Run as deploy user, not root" >&2
  exit 1
fi

sudo install -d -o "$USER" -g "$USER" "$(dirname "$APP_DIR")"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi

cd "$APP_DIR/backend"
npm ci
cd "$APP_DIR/frontend"
npm ci

# Configure backend env
cat > "$APP_DIR/backend/.env" <<EOF
PORT=${BACKEND_PORT}
NODE_ENV=production
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=12h
SUPERADMIN_EMPLOYEE_ID=${SUPERADMIN_EMPLOYEE_ID}
SUPERADMIN_NAME=${SUPERADMIN_NAME}
SUPERADMIN_PASSWORD=${SUPERADMIN_PASSWORD}
EOF
chmod 600 "$APP_DIR/backend/.env"

# Configure frontend env for same-origin mode
cat > "$APP_DIR/frontend/.env" <<EOF
VITE_API_URL=
VITE_APP_BASE_PATH=/
EOF

# Ensure DB role/database exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

cd "$APP_DIR/backend"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}" ./scripts/migrate-all.sh
npm run bootstrap:superadmin

cd "$APP_DIR/frontend"
npm run build

sudo npm install -g pm2
mkdir -p "$HOME/.pm2"
cp "$APP_DIR/deploy/hostinger/ecosystem.config.cjs" "$HOME/ecosystem.config.cjs"
pm2 start "$HOME/ecosystem.config.cjs"
pm2 save

# Keep PM2 owned by deploy user. Avoid running PM2 commands as root to prevent duplicate process trees.
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME"

sudo cp "$APP_DIR/deploy/hostinger/nginx-lite-mes.conf" /etc/nginx/sites-available/lite-mes
sudo ln -sf /etc/nginx/sites-available/lite-mes /etc/nginx/sites-enabled/lite-mes
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "Deploy complete."
echo "Check: http://$(hostname -I | awk '{print $1}')/health and /ready"
