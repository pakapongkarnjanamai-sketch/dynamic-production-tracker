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

## Key Libraries

| Library | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing |
| `html5-qrcode` | Camera-based QR Code scanning |
| `tailwindcss` | Utility-first CSS |
