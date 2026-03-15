# Lite MES — Frontend

React 18 + Vite + Tailwind CSS

## Pages

| Path | Description |
|------|-------------|
| `/` | Shop Floor — production-line overview + QR scan entry |
| `/scan` | QR Code scanner → tray lookup → Start / Finish / NG |
| `/admin` | Admin Dashboard — CRUD for Lines and Processes |
| `/report` | Real-time production log summary |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit VITE_API_URL to point at your running backend

# 3. Run dev server (http://localhost:5173)
npm run dev

# 4. Build for production
npm run build
npm run preview
```

## Deployment Modes

### 1) Same-origin (recommended first rollout)

- Host frontend and backend on the same domain.
- Set `VITE_API_URL=` (empty) so API calls use relative `/api/...` paths.
- Keep `VITE_APP_BASE_PATH=/` unless your app is under a subpath.

### 2) Separate-origin

- Frontend and backend are on different domains.
- Set `VITE_API_URL=https://api.your-domain.com`.
- Backend `ALLOWED_ORIGINS` must include the frontend domain.

### 3) Subpath hosting

- If app is served under a path like `/mes`, set `VITE_APP_BASE_PATH=/mes`.
- Vite `base` and React Router basename are derived from this value.

## Key Libraries

| Library | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing |
| `html5-qrcode` | Camera-based QR Code scanning |
| `tailwindcss` | Utility-first CSS |
