# 🏭 VS MES — Dynamic Production Tracker

**VS MES (Manufacturing Execution System)** คือระบบติดตามการผลิตแบบ Dynamic สำหรับโรงงานอุตสาหกรรม ออกแบบมาให้มีน้ำหนักเบา (Lightweight) ทำงานผ่านคลาวด์/เว็บเบราว์เซอร์ และเน้นประสบการณ์การใช้งาน (UX/UI) ที่ดีเยี่ยม โดยเฉพาะสำหรับผู้ปฏิบัติงานหน้างาน (Operators) ที่ใช้งานผ่านแท็บเล็ตหรือสมาร์ทโฟน

---

## ✨ ฟีเจอร์เด่น (Key Features)

* **📱 Mobile-First Shop Floor:** หน้าสแกนทำงาน (Scan Page) ออกแบบมาเพื่อหน้าจอสัมผัสโดยเฉพาะ ปุ่มกดขนาดใหญ่ สีสันชัดเจน พร้อมระบบสั่นตอบสนอง (Haptic feedback)
* **⚙️ Dynamic Master-Detail Admin:** หน้าจัดการระบบที่ใช้งานง่าย เมื่อคลิกเลือกสายการผลิต ข้อมูลขั้นตอนจะอัปเดตตามทันทีในหน้าจอเดียวกัน ไม่ต้องโหลดหน้าใหม่
* **🖨️ Integrated QR Printing:** สร้างและสั่งพิมพ์ฉลาก QR Code สำหรับติดถาดงานได้ทันทีจากระบบเบราว์เซอร์ โดยไม่ต้องพึ่งพาซอฟต์แวร์ภายนอก
* **📊 Multi-dimensional Reports:** หน้าต่างรายงานแบบแท็บ แยกดูข้อมูลได้ 3 มิติ:
    * สถานะถาดงาน (ภาพรวม)
    * ประสิทธิภาพรายขั้นตอน (คอขวดอยู่ที่ไหน)
    * ประสิทธิภาพผู้ปฏิบัติงาน (ใครทำผลงานได้ดีที่สุด)

---

## 🛠 Tech Stack

| ส่วน (Layer) | เทคโนโลยี (Technology) |
|--------------|-------------------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, `html5-qrcode` |
| **Backend** | Node.js 18+, Express 4, `pg` (node-postgres) |
| **Database** | PostgreSQL 14+ |

---

## 📐 โครงสร้างโปรเจค (Project Structure)

โปรเจคนี้เป็นแบบ Monorepo ประกอบด้วย 2 ส่วนหลัก:

```text
dynamic-production-tracker/
├── .vscode/                                  # การตั้งค่าสำหรับ VS Code
│   ├── dynamic-production-tracker.code-workspace # ไฟล์เปิดโปรเจค
│   ├── launch.json                           # ตั้งค่าการ Debug
│   ├── tasks.json                            # คำสั่งรัน Server อัตโนมัติ
│   └── api-tests.http                        # ไฟล์ทดสอบ API (REST Client)
├── backend/                                  # ฝั่งเซิร์ฟเวอร์และ API
│   ├── database/
│   │   └── schema.sql                        # โครงสร้างฐานข้อมูล
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/                      # ควบคุม Logic ของ API
│   │   ├── routes/                           # กำหนดเส้นทาง API
│   │   └── index.js                          # จุดเริ่มต้น Backend
│   └── package.json
└── frontend/                                 # ฝั่งส่วนติดต่อผู้ใช้งาน
    ├── src/
    │   ├── api/client.js                     # ตัวเชื่อมต่อ API
    │   ├── components/                       # UI Components (QRScanner, ProcessCard)
    │   ├── pages/                            # หน้าจอต่างๆ (ShopFloor, Scan, Admin, Report)
    │   ├── App.jsx                           # ระบบ Router และ Navigation Bar
    │   └── main.jsx
    └── package.json
```

---

## 🚀 Deployment (Hostinger Ubuntu 24.04)

เริ่ม deploy แบบ VPS เครื่องเดียวได้จากคู่มือ:

- `deploy/hostinger/README.md`

สถานะ production rollout ปัจจุบัน:

- Domain: `bpsgroup.cloud`
- HTTPS: เปิดใช้งานแล้ว (Let's Encrypt)
- Backend process manager: PM2 (run as deploy user)
