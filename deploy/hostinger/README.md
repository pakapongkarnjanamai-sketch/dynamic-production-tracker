# Hostinger KVM 2 Deployment (Ubuntu 24.04)

This folder contains production deployment assets for a single-server setup:
- PostgreSQL on the same VPS
- Backend managed by PM2
- Frontend served by Nginx
- API proxied at /api

## 1. Upload project to your server

Use Git (recommended):

```bash
ssh root@YOUR_SERVER_IP
git clone https://github.com/YOUR_ORG/YOUR_REPO.git /opt/dynamic-production-tracker
```

Or upload source files with scp/rsync to `/opt/dynamic-production-tracker`.

## 2. Bootstrap server (run as root)

```bash
ssh root@YOUR_SERVER_IP
cd /opt/dynamic-production-tracker/deploy/hostinger
chmod +x bootstrap-server.sh
DEPLOY_USER=deploy SSH_PORT=22 ./bootstrap-server.sh
```

## 3. Copy SSH key to deploy user

From local machine:

```bash
ssh-copy-id deploy@YOUR_SERVER_IP
```

Then login as deploy user:

```bash
ssh deploy@YOUR_SERVER_IP
```

## 4. Deploy application (run as deploy user)

```bash
cd /opt/dynamic-production-tracker/deploy/hostinger
chmod +x deploy-app.sh
REPO_URL=https://github.com/YOUR_ORG/YOUR_REPO.git \
DB_PASSWORD='replace-with-strong-db-password' \
JWT_SECRET='replace-with-long-random-secret' \
SUPERADMIN_PASSWORD='replace-with-strong-password' \
ALLOWED_ORIGINS='http://YOUR_SERVER_IP' \
./deploy-app.sh
```

Notes:
- If your repository is private, ensure deploy user has access key/token.
- If you copy project files directly instead of using Git, edit deploy-app.sh to skip clone/pull.

## 5. Verify service

```bash
curl -sS http://YOUR_SERVER_IP/health
curl -sS http://YOUR_SERVER_IP/ready
pm2 status
sudo systemctl status nginx --no-pager
```

## 6. Optional hardening after first successful deploy

- Disable root SSH login
- Disable password authentication and use SSH keys only
- Add domain and HTTPS (Certbot)
- Set ALLOWED_ORIGINS to your domain and redeploy

## Included files

- bootstrap-server.sh: install packages and baseline host setup
- deploy-app.sh: clone, configure env, migrate DB, build frontend, start PM2, configure Nginx
- nginx-lite-mes.conf: Nginx site config for SPA + API proxy
- ecosystem.config.cjs: PM2 app process definition
