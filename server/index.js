import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(express.json());

const dbPromise = open({ filename: "./requests.db", driver: sqlite3.Database });

app.get("/requests", async (req, res) => {
  const db = await dbPromise;
  const data = await db.all("SELECT * FROM requests");
  res.json(data);
});

app.post("/requests", async (req, res) => {
  const { wip, reg, work, status, overallLabour } = req.body;
  const db = await dbPromise;
  const result = await db.run(
    "INSERT INTO requests (wip, reg, work, status, overallLabour) VALUES (?, ?, ?, ?, ?)",
    [wip, reg, work, status, overallLabour]
  );
  res.json({ id: result.lastID, wip, reg, work, status, overallLabour });
});

app.patch("/requests/:id", async (req, res) => {
  const { status } = req.body;
  const db = await dbPromise;
  await db.run("UPDATE requests SET status = ? WHERE id = ?", [status, req.params.id]);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  const db = await dbPromise;
  await db.exec(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wip TEXT,
    reg TEXT,
    work TEXT,
    status TEXT,
    overallLabour REAL
  )`);
  console.log("Server running on port", PORT);
});
