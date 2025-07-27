import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(express.json());

let db;

const init = async () => {
  db = await open({
    filename: "./data.db",
    driver: sqlite3.Database,
  });

  await db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wip TEXT,
      reg TEXT,
      work TEXT,
      tasks TEXT,
      status TEXT,
      submittedAt TEXT
    )
  `);
};

app.get("/requests", async (req, res) => {
  const rows = await db.all("SELECT * FROM requests");
  res.json(rows.map(r => ({ ...r, tasks: JSON.parse(r.tasks || "[]") })));
});

app.post("/requests", async (req, res) => {
  const { wip, reg, work, tasks, status, submittedAt } = req.body;
  const result = await db.run(
    "INSERT INTO requests (wip, reg, work, tasks, status, submittedAt) VALUES (?, ?, ?, ?, ?, ?)",
    [wip, reg, work, JSON.stringify(tasks), status, submittedAt]
  );
  res.json({ id: result.lastID });
});

app.put("/requests/:id", async (req, res) => {
  const { wip, reg, work, tasks, status, submittedAt } = req.body;
  await db.run(
    "UPDATE requests SET wip = ?, reg = ?, work = ?, tasks = ?, status = ?, submittedAt = ? WHERE id = ?",
    [wip, reg, work, JSON.stringify(tasks), status, submittedAt, req.params.id]
  );
  res.sendStatus(200);
});

init();
app.listen(3001, () => console.log("Server running on port 3001"));