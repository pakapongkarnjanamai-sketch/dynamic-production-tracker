# Dynamic Production Tracker — Lite MES Demo

> **Lite MES (Manufacturing Execution System)** — ระบบติดตามการผลิตแบบ Dynamic สำหรับโรงงานอุตสาหกรรม  
> A lightweight, cloud-ready MES demo with fully dynamic production-line configuration.

---

## 📐 โครงสร้างโปรเจค / Project Structure

```
dynamic-production-tracker/
├── backend/          # Node.js + Express API (PostgreSQL)
│   ├── database/
│   │   └── schema.sql
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/         # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md         # (this file)
```

---

## 🗄️ ฐานข้อมูล / Database Design

| Table | คำอธิบาย / Description |
|-------|------------------------|
| `lines` | สายการผลิต — Production Lines |
| `processes` | ขั้นตอนการทำงานในแต่ละสาย — Ordered processes per line |
| `trays` | ถาดงาน + QR Code — Work trays identified by QR code |
| `production_logs` | บันทึกการผลิต — Start / Finish / NG events |

---

## 🚀 วิธีเริ่มต้น (Getting Started)

### ข้อกำหนดเบื้องต้น / Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- `npm` หรือ `yarn`

---

### 1. Clone โปรเจค / Clone the repo

```bash
git clone https://github.com/pakapongkarnjanamai-sketch/dynamic-production-tracker.git
cd dynamic-production-tracker
```

---

### 2. ตั้งค่าฐานข้อมูล / Set up the database

```bash
# สร้าง database (ถ้ายังไม่มี)
# Create the database if it doesn't exist yet
createdb lite_mes

# รัน schema + demo seed data
# Run schema migrations and seed demo data
psql postgresql://postgres:password@localhost:5432/lite_mes \
     -f backend/database/schema.sql
```

---

### 3. เริ่มต้น Backend / Start the backend

```bash
cd backend

# คัดลอกไฟล์ตัวอย่าง env
cp .env.example .env
# แก้ไข DATABASE_URL และ PORT ตามต้องการ
# Edit DATABASE_URL and PORT as needed

# ติดตั้ง dependencies
npm install

# โหมด development (auto-reload)
npm run dev

# หรือโหมด production
# npm start
```

API จะรันที่ / API runs at: **http://localhost:4000**

**Endpoints หลัก / Key endpoints:**

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET`  | `/api/lines` | ดึงรายการสายการผลิต |
| `GET`  | `/api/lines/:id/processes` | สายการผลิต + ขั้นตอนทั้งหมด |
| `POST` | `/api/lines` | เพิ่มสายการผลิต |
| `PUT`  | `/api/lines/:id` | แก้ไขสายการผลิต |
| `DELETE` | `/api/lines/:id` | ลบสายการผลิต |
| `GET`  | `/api/processes?line_id=` | ขั้นตอนของสาย |
| `POST` | `/api/processes` | เพิ่มขั้นตอน |
| `PUT`  | `/api/processes/:id` | แก้ไข / จัดลำดับขั้นตอน |
| `GET`  | `/api/trays/scan/:qrCode` | **สแกน QR** — ดึงข้อมูลถาด + ขั้นตอน |
| `POST` | `/api/logs` | บันทึก start / finish / ng |
| `GET`  | `/api/logs/summary` | สรุปความคืบหน้าต่อถาด |
| `GET`  | `/health` | Health check |

---

### 4. เริ่มต้น Frontend / Start the frontend

```bash
cd frontend

# คัดลอกไฟล์ตัวอย่าง env
cp .env.example .env
# แก้ไข VITE_API_URL ให้ตรงกับ backend
# Edit VITE_API_URL to match your backend address

# ติดตั้ง dependencies
npm install

# โหมด development (http://localhost:5173)
npm run dev

# Build สำหรับ production
# npm run build && npm run preview
```

---

## 📱 หน้าจอหลัก / Main Pages

| URL | หน้าจอ / Page | คำอธิบาย |
|-----|--------------|----------|
| `/` | 🏭 Shop Floor | ภาพรวมสายการผลิต + ปุ่มสแกน QR |
| `/scan` | 📷 Scan QR | สแกน QR Code → กด Start / Finish / NG |
| `/admin` | 🛠 Admin Dashboard | CRUD Lines & Processes แบบ Dynamic |
| `/report` | 📊 Report | รายงาน Real-time ต่อถาดงาน |

---

## ⚙️ Dynamic Configuration

แอดมินสามารถ:  
Admins can:

- **เพิ่ม/ลบ/แก้ไข** สายการผลิต (Production Lines) ผ่านหน้า `/admin`
- **เพิ่ม/จัดลำดับ/ลบ** ขั้นตอน (Processes) ในแต่ละสายได้อิสระ
- หน้า Shop Floor และ Scan จะ **อัปเดตอัตโนมัติ** ตาม Config ที่ตั้งไว้ **โดยไม่ต้องแก้โค้ด**

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, html5-qrcode |
| Backend | Node.js 18+, Express 4, pg (node-postgres) |
| Database | PostgreSQL 14+ |

---

## 📄 License

MIT
