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
  seedTestUser();
  seedBooks();
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

function seedTestUser() {
  const testEmail = 'julia@uni.cat';
  const exists = db.prepare('SELECT id FROM Users WHERE email = ?').get(testEmail);
  if (exists) return;

  const passwordHash = bcrypt.hashSync('Test1234', 10);
  db.prepare(
    "INSERT INTO Users (email, password_hash, role) VALUES (?, ?, 'user')"
  ).run(testEmail, passwordHash);

  console.log('Usuari de prova creat: julia@uni.cat / Test1234');
}

function seedBooks() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM Books').get();
  if (count.n > 0) return;

  const books = [
    ['El quadern gris', 'Josep Pla', '9788429776034', 3],
    ['La plaça del Diamant', 'Mercè Rodoreda', '9788429721584', 4],
    ['Mirall trencat', 'Mercè Rodoreda', '9788429749366', 2],
    ['Jo confesso', 'Jaume Cabré', '9788429762689', 5],
    ['Les veus del Pamano', 'Jaume Cabré', '9788429757330', 2],
    ['Camí de sirga', 'Jesús Moncada', '9788429733159', 3],
    ['Pedra de tartera', 'Maria Barbal', '9788429745139', 1],
    ['Bearn o la sala de les nines', 'Llorenç Villalonga', '9788429750119', 2]
  ];

  const insert = db.prepare(
    `INSERT INTO Books (title, author, isbn, copies_total, copies_available, status)
     VALUES (?, ?, ?, ?, ?, 'Disponible')`
  );
  const insertAll = db.transaction((rows) => {
    for (const [title, author, isbn, copies] of rows) {
      insert.run(title, author, isbn, copies, copies);
    }
  });
  insertAll(books);

  console.log(`Catàleg inicial sembrat: ${books.length} llibres`);
}

function syncBookStatus(bookId) {
  const book = db.prepare('SELECT copies_available FROM Books WHERE id = ?').get(bookId);
  if (!book) return;
  const status = book.copies_available > 0 ? 'Disponible' : 'Reservat';
  db.prepare('UPDATE Books SET status = ? WHERE id = ?').run(status, bookId);
}

module.exports = { db, initDatabase, syncBookStatus, dbPath };
