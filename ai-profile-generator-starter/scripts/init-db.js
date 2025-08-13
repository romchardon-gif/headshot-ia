import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('data.sqlite');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  style TEXT,
  paid INTEGER DEFAULT 0,
  urls TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now'))
);
`);

console.log('DB initialized');
