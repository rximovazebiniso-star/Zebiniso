// Netlify funksiyasi: brauzer va MySQL (TiDB) o'rtasidagi ko'prik
import mysql from "mysql2/promise";

// Bazaga ulanish. Parol env'dan olinadi, kodda yozilmaydi.
function connect() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  let db;
  try {
    db = await connect();

    // POST: yangi ism qo'shish
    if (req.method === "POST") {
      const body = await req.json();
      const name = String(body.name || "").trim().slice(0, 100);
      if (!name) return json({ error: "Ism bo'sh bo'lmasin" }, 400);
      await db.execute("INSERT INTO notes (name) VALUES (?)", [name]);
      return json({ ok: true });
    }

    // GET: hamma ismlarni qaytarish (yangisi tepada)
    const [rows] = await db.execute(
      "SELECT id, name, created_at FROM notes ORDER BY id DESC"
    );
    return json(rows);
  } catch (err) {
    return json({ error: err.message }, 500);
  } finally {
    if (db) await db.end();
  }
};
