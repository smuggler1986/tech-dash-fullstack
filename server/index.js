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
  const formatted = data.map(row => ({
    ...row,
    tasks: row.tasks ? JSON.parse(row.tasks) : []
  }));
  res.json(formatted);
});

app.post("/requests", async (req, res) => {
  const { wip, reg, work, status, overallLabour, tasks = [] } = req.body;
  const db = await dbPromise;
  const result = await db.run(
    "INSERT INTO requests (wip, reg, work, status, overallLabour, tasks) VALUES (?, ?, ?, ?, ?, ?)",
    [wip, reg, work, status, overallLabour, JSON.stringify(tasks)]
  );
  res.json({ id: result.lastID, wip, reg, work, status, overallLabour, tasks });
});

app.patch("/requests/:id", async (req, res) => {
  const { status, tasks } = req.body;
  const db = await dbPromise;

  let newStatus = status;
  if (Array.isArray(tasks)) {
    const approvedCount = tasks.filter(t => t.approved).length;
    const totalCount = tasks.length;
    if (approvedCount > 0 && approvedCount < totalCount) {
      newStatus = "Partially approved";
    } else if (approvedCount === totalCount && totalCount > 0) {
      newStatus = "Authorised";
    }
  }

  await db.run(
    "UPDATE requests SET status = ?, tasks = ? WHERE id = ?",
    [newStatus, JSON.stringify(tasks), req.params.id]
  );
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
    overallLabour REAL,
    tasks TEXT
  )`);
  console.log("Server running on port", PORT);
});
