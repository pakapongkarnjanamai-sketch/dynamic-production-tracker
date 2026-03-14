# Dynamic Production Tracker — Lite MES Demo

> **Lite MES (Manufacturing Execution System)** — ระบบติดตามการผลิตแบบ Dynamic สำหรับโรงงานอุตสาหกรรม
> A lightweight, cloud-ready MES demo with fully dynamic production-line configuration.

---

## 📐 โครงสร้างโปรเจค / Project Structure

```
dynamic-production-tracker/
├── .vscode/
│   ├── extensions.json   # recommended extensions
│   ├── settings.json     # editor/Tailwind/ESLint settings
│   ├── launch.json       # Node.js + Chrome debug configs
│   ├── tasks.json        # dev-server tasks (Ctrl+Shift+B)
│   └── api-tests.http    # REST Client requests for every endpoint
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
├── dynamic-production-tracker.code-workspace  # ← เปิดใน VS Code
└── README.md         # (this file)
```

---

## 🗄️ ฐานข้อมูล / Database Design

| Table | คำอธิบาย / Description |
|-------|------------------------|
| `lines` | สายการผลิต — Production Lines |
| `processes` | ขั้นตอนการทำงานในแต่ละสาย — Ordered processes per line |
| `trays` | ถาดงาน + QR Code — Work trays identified by QR code |
| `production_logs` | บันทึกการผลิต — Start / Finish / NG events per tray |
| `qr_codes` | ทะเบียน QR Code ระดับชิ้นงาน — Individual work-item / product-unit registry |
| `qr_scan_events` | ประวัติการสแกนทุกครั้ง — Full scan audit log (operator, station, result) |

---

## 🚀 วิธีเริ่มต้น (Getting Started)

### ข้อกำหนดเบื้องต้น / Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- `npm` หรือ `yarn`

---

## 💻 เปิดใน VS Code / Open in VS Code

### วิธีที่ 1 — เปิด Workspace File (แนะนำ) / Method 1 — Open Workspace File (recommended)

1. **Clone** โปรเจคลงเครื่อง (ดูขั้นตอนด้านล่าง)
2. เปิด VS Code → **File → Open Workspace from File…**
3. เลือกไฟล์ `dynamic-production-tracker.code-workspace` ในโฟลเดอร์โปรเจค
4. VS Code จะแสดง 2 โฟลเดอร์ (Backend + Frontend) พร้อมกันใน Explorer
5. คลิก **"Install Extensions"** เมื่อ VS Code แจ้งเตือนให้ติดตั้ง extension ที่แนะนำ

> 💡 ไฟล์ `.code-workspace` รวม settings, extensions, debug configs, และ tasks ไว้ในที่เดียว

---

1. **Clone** the project (see step below)
2. Open VS Code → **File → Open Workspace from File…**
3. Select `dynamic-production-tracker.code-workspace` inside the project folder
4. VS Code shows both `Backend` and `Frontend` roots side-by-side in the Explorer
5. Click **"Install Extensions"** when VS Code prompts to install the recommended extensions

---

### วิธีที่ 2 — เปิดโฟลเดอร์ตรง / Method 2 — Open folder directly

```bash
# Terminal / Command Prompt
code dynamic-production-tracker
```

หรือ / or: **File → Open Folder…** → เลือกโฟลเดอร์ `dynamic-production-tracker`

---

### Extensions ที่แนะนำ / Recommended Extensions

VS Code จะแสดง pop-up ให้ติดตั้งอัตโนมัติ หรือสามารถติดตั้งเองได้จาก Extensions panel (`Ctrl+Shift+X`):

| Extension | ประโยชน์ |
|-----------|---------|
| **ESLint** | ตรวจสอบโค้ด JavaScript |
| **Prettier** | จัดรูปแบบโค้ดอัตโนมัติ |
| **Tailwind CSS IntelliSense** | Autocomplete class ของ Tailwind |
| **Simple React Snippets** | Snippet สำหรับ React |
| **REST Client** | ทดสอบ API ใน `.vscode/api-tests.http` |
| **PostgreSQL** | Browser ฐานข้อมูลใน VS Code |
| **GitLens** | Git history และ blame inline |

---

### เริ่ม Dev Server ทั้ง 2 ตัวพร้อมกัน / Start both dev servers at once

```
Ctrl+Shift+B   (Windows / Linux)
Cmd+Shift+B    (macOS)
```

VS Code จะรัน `npm run dev` ใน `backend/` และ `frontend/` พร้อมกันในแท็บ Terminal แยก

หรือ / or: **Terminal → Run Task… → 🚀 Start Full Stack**

---

### Debug / ดีบัก

เปิด **Run and Debug** panel (`Ctrl+Shift+D`) แล้วเลือก:

| Configuration | คำอธิบาย |
|---------------|---------|
| `🚀 Start Full Stack` | เปิด backend debugger + Chrome พร้อมกัน |
| `🖥 Debug Backend` | Debug Express API — วาง breakpoint ใน `backend/src/**/*.js` |
| `🌐 Open Frontend (Chrome)` | เปิด Chrome แบบ debug mode ที่ `http://localhost:5173` |

---

### ทดสอบ API ใน VS Code / Test API inside VS Code

เปิดไฟล์ `.vscode/api-tests.http` แล้วคลิก **"Send Request"** เหนือ request ที่ต้องการ
(ต้องมี extension **REST Client** ติดตั้งก่อน)

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
| `GET`  | `/api/trays/scan/:qrCode?operator=&station=` | **สแกน QR (ถาด)** — ดึงข้อมูลถาด + ขั้นตอน + บันทึก scan event |
| `POST` | `/api/logs` | บันทึก start / finish / ng |
| `GET`  | `/api/logs/summary` | สรุปความคืบหน้าต่อถาด |
| `GET`  | `/api/qrcodes` | ดึงรายการ QR Codes (filter: line_id, status, batch_no) |
| `GET`  | `/api/qrcodes/scan/:code?operator=&station=` | **สแกน QR (ชิ้นงาน)** — ค้นหา registry + บันทึก scan event อัตโนมัติ |
| `POST` | `/api/qrcodes` | ลงทะเบียน QR Code ใหม่ |
| `PUT`  | `/api/qrcodes/:id` | แก้ไข QR Code |
| `DELETE` | `/api/qrcodes/:id` | ลบ QR Code |
| `GET`  | `/api/scan-events` | ดึงประวัติการสแกนทั้งหมด (filter: qr_code, operator, station, result) |
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
| `/scan` | 📷 Scan QR | กรอก Operator + Station → สแกน QR Code → กด Start / Finish / NG |
| `/qrcodes` | 🔖 QR Codes | ลงทะเบียนชิ้นงาน / ดูทะเบียน QR / ดูประวัติการสแกนทุกครั้ง |
| `/admin` | 🛠 Admin Dashboard | จัดการ Lines, Processes, Trays & Operators — UI แบบ Tab แยกชัดเจน 3 แท็บ |
| `/report` | 📊 Report | รายงาน Real-time ต่อถาดงาน |

---

## ⚙️ Dynamic Configuration

แอดมินสามารถ:
Admins can:

- **เพิ่ม/ลบ/แก้ไข** สายการผลิต (Production Lines) ผ่านหน้า `/admin`
- **เพิ่ม/จัดลำดับ/ลบ** ขั้นตอน (Processes) ในแต่ละสายได้อิสระ
- หน้า Shop Floor และ Scan จะ **อัปเดตอัตโนมัติ** ตาม Config ที่ตั้งไว้ **โดยไม่ต้องแก้โค้ด**

### 🛠 Admin Dashboard UI

หน้า `/admin` ออกแบบเป็น **Tab Navigation** แบ่งเป็น 3 แท็บชัดเจน:

| แท็บ | ประกอบด้วย | สี |
|------|------------|----|
| 🏭 สายการผลิต & ขั้นตอน | จัดการ Lines + Processes ในหน้าเดียว | น้ำเงิน |
| 📦 ถาดงาน | CRUD Trays พร้อม Filter และ Search | เหลือง/Amber |
| 👷 ผู้ปฏิบัติงาน | CRUD Operators พร้อม Toggle Active/Inactive | เขียว/Emerald |

- แต่ละแท็บมี **Header gradient** และ badge แสดงจำนวนรายการ
- Layout แบ่ง **ฟอร์ม (ซ้าย) / ตาราง (ขวา)** ในหน้าจอขนาดกลางขึ้นไป
- แท็บ **สายการผลิต & ขั้นตอน** แสดง 2 ส่วนซ้อนกัน (Lines → Processes) เพื่อให้เห็นความสัมพันธ์ได้ทันที

## 🔖 QR Code Tracking

ระบบรองรับการติดตาม QR Code 2 ระดับ:

**ระดับถาดงาน (Tray)** — ใช้งานแบบเดิมผ่าน `/scan`
- ถาดหนึ่งใบแทน batch ของชิ้นงาน
- สแกนเพื่อบันทึก start / finish / ng ต่อขั้นตอน

**ระดับชิ้นงาน (Work Item)** — ระบบใหม่ผ่าน `/qrcodes`
- ลงทะเบียนชิ้นงานแต่ละชิ้นพร้อม serial_no, batch_no, product
- เชื่อมโยงกับสายการผลิตและถาดได้ (optional)
- `GET /api/qrcodes/scan/:code` ค้นหาชิ้นงานและคืน process list จาก tray ที่ผูกไว้

**Scan Event Log** — ทุกการสแกนทั้ง 2 ระดับจะถูกบันทึกใน `qr_scan_events` อัตโนมัติ พร้อม:
- `operator` — ชื่อผู้สแกน (กรอกครั้งแรกแล้วจำไว้ใน localStorage)
- `station` — สถานีสแกน
- `result` — `found` / `not_found` / `duplicate`
- `scanned_at` — timestamp

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
