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
DEPLOY_DOMAIN=bpsgroup.cloud \
DB_PASSWORD='replace-with-strong-db-password' \
JWT_SECRET='replace-with-long-random-secret' \
SUPERADMIN_PASSWORD='replace-with-strong-password' \
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

## 7. Domain + HTTPS quick setup

1. Point `A` records for `bpsgroup.cloud` and `www.bpsgroup.cloud` to your VPS IP.
2. Ensure Nginx site uses `deploy/hostinger/nginx-vs-mes.conf`.
3. Issue certificate:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bpsgroup.cloud -d www.bpsgroup.cloud
```

4. Verify renewal:

```bash
sudo certbot renew --dry-run
```

If renewal fails with `Invalid response` on `/.well-known/acme-challenge/*`, confirm the ACME location block is present and served from `/var/www/html` in both HTTP and HTTPS server blocks.

## 8. Troubleshooting (from live rollout)

### PM2 `EADDRINUSE: 4000`

Cause: backend started twice (one plain `node` process + one PM2 process, or PM2 under both root and deploy).

Fix:

```bash
pm2 delete all || true
pm2 kill || true
sudo fuser -k 4000/tcp || true
sudo -u deploy bash -lc 'cd /srv/dynamic-production-tracker/backend && NODE_ENV=production PORT=4000 pm2 start src/index.js --name vs-mes-backend'
sudo -u deploy pm2 save
```

Always run PM2 using deploy user to avoid duplicate PM2 homes (`/root/.pm2` and `/home/deploy/.pm2`).

### Login returns `{"error":"Internal server error"}`

Verify backend process health and that only one backend process is bound to port `4000`.

```bash
sudo -u deploy pm2 list
sudo lsof -iTCP:4000 -sTCP:LISTEN -n -P
curl -sS http://127.0.0.1:4000/ready
```

## Included files

- bootstrap-server.sh: install packages and baseline host setup
- deploy-app.sh: clone, configure env, migrate DB, build frontend, start PM2, configure Nginx
- nginx-vs-mes.conf: Nginx site config for SPA + API proxy
- ecosystem.config.cjs: PM2 app process definition
