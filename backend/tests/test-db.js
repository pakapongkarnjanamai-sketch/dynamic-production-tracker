require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ เชื่อมต่อ Database บน VPS สำเร็จ!");

    // ลองดึงเวลาจากเซิร์ฟเวอร์ดูเล่นๆ (ไม่กระทบข้อมูล)
    const result = await client.query("SELECT NOW()");
    console.log("เวลาบน Database Server:", result.rows[0].now);

    client.release();
  } catch (err) {
    console.error("❌ ไม่สามารถเชื่อมต่อ Database ได้:", err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
