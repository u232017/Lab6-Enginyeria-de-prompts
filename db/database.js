const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'biblioteca.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT NOT NULL UNIQUE,
      copies_total INTEGER NOT NULL CHECK (copies_total >= 1),
      copies_available INTEGER NOT NULL CHECK (copies_available >= 0),
      status TEXT NOT NULL DEFAULT 'Disponible' CHECK (status IN ('Disponible', 'Reservat')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Activa' CHECK (status IN ('Activa', 'Cancelada', 'Completada')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      cancelled_at TEXT,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_user ON Reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_book ON Reservations(book_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_active ON Reservations(user_id, status);
  `);

  seedAdminUser();
}

function seedAdminUser() {
  const adminEmail = 'admin@biblioteca.cat';
  const exists = db.prepare('SELECT id FROM Users WHERE email = ?').get(adminEmail);
  if (exists) return;

  const passwordHash = bcrypt.hashSync('Admin123!', 10);
  db.prepare(
    "INSERT INTO Users (email, password_hash, role) VALUES (?, ?, 'admin')"
  ).run(adminEmail, passwordHash);

  console.log('Usuari administrador creat: admin@biblioteca.cat / Admin123!');
}

function syncBookStatus(bookId) {
  const book = db.prepare('SELECT copies_available FROM Books WHERE id = ?').get(bookId);
  if (!book) return;
  const status = book.copies_available > 0 ? 'Disponible' : 'Reservat';
  db.prepare('UPDATE Books SET status = ? WHERE id = ?').run(status, bookId);
}

module.exports = { db, initDatabase, syncBookStatus, dbPath };
