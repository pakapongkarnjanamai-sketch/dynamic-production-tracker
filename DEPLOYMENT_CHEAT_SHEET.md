# 🚀 VS MES - Deployment Guide

เอกสารนี้รวบรวมข้อมูลระบบ ขั้นตอนการอัปเดตแบบทำเองทีละขั้นตอน (Manual) และสคริปต์สำหรับอัปเดตอัตโนมัติ (Auto) สำหรับเซิร์ฟเวอร์ Hostinger VPS

## 📌 ข้อมูลระบบเบื้องต้น (System Info)

- **OS:** Ubuntu 24.04 LTS
- **User สำหรับ Deploy:** `deploy`
- **ตำแหน่งโปรเจกต์ (Path):** `/srv/dynamic-production-tracker`
- **ชื่อ PM2 Process (Backend):** `vs-mes-backend`
- **โดเมนหลัก:** `bpsgroup.cloud`

---

## 🛠️ วิธีที่ 1: อัปเดตแบบ Manual (ทำทีละขั้นตอน)

### 1. เข้าสู่ Server และสลับ User

```bash
ssh root@76.13.222.196
sudo - deploy
```

### 2. อัปเดตโค้ดจาก Git

```bash
cd /srv/dynamic-production-tracker
git pull origin main
```

### 3. อัปเดตฝั่ง Backend

```bash
cd backend
npm install
pm2 restart vs-mes-backend
pm2 save
```

### 4. อัปเดตฝั่ง Frontend

```bash
cd ../frontend
npm install
npm run build
```

---

---

## 💡 คำแนะนำเพิ่มเติม (Pro-Tips)

- **เช็คสถานะระบบ:** `pm2 status`
- **ดู Error Logs:** `pm2 logs vs-mes-backend`
- **Hard Refresh:** หากอัปเดต CSS/Frontend แล้วหน้าเว็บไม่เปลี่ยน ให้กด `Ctrl + F5` ใน Browser
- **Database:** หากมีการแก้ไข Schema ใน `backend/database/schema.sql` อย่าลืมรันคำสั่ง SQL ใน Postgres ด้วยครับ
