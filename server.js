const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { db, initDatabase, syncBookStatus } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'biblioteca-mvp-secret-canviar-en-produccio';
const MAX_RESERVATIONS_PER_USER = 3;

initDatabase();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Cal autenticar-se' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = db.prepare('SELECT id, email, role FROM Users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'Usuari no trobat' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid o expirat' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acces denegat: cal rol administrador' });
  }
  next();
}

app.post('/api/auth/register', (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Cal indicar correu, contrasenya i confirmacio' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Format de correu invalid' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: 'La contrasenya ha de tenir minim 8 caracters, una lletra i un digit'
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Les contrasenyes no coincideixen' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM Users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "No s'ha pogut completar el registre" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO Users (email, password_hash, role) VALUES (?, ?, 'user')")
    .run(normalizedEmail, passwordHash);

  const user = { id: result.lastInsertRowid, email: normalizedEmail, role: 'user' };
  const token = createToken(user);

  res.status(201).json({ message: 'Registre exitos', user, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Cal indicar correu i contrasenya' });
  }

  const user = db
    .prepare('SELECT id, email, password_hash, role FROM Users WHERE email = ?')
    .get(email.trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credencials incorrectes' });
  }

  const token = createToken(user);
  res.json({
    user: { id: user.id, email: user.email, role: user.role },
    token
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/books', (req, res) => {
  const books = db
    .prepare(
      `SELECT id, title, author, isbn, copies_total, copies_available, status, created_at
       FROM Books ORDER BY title ASC`
    )
    .all();
  res.json(books);
});

app.post('/api/books', authMiddleware, adminMiddleware, (req, res) => {
  const { title, author, isbn, copies } = req.body;

  if (!title?.trim() || !author?.trim() || !isbn?.trim()) {
    return res.status(400).json({ error: 'Titol, autor i ISBN son obligatoris' });
  }

  const copiesTotal = parseInt(copies, 10);
  if (Number.isNaN(copiesTotal) || copiesTotal < 1) {
    return res.status(400).json({ error: 'El nombre dexemplars ha de ser com a minim 1' });
  }

  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(cleanIsbn)) {
    return res.status(400).json({ error: 'ISBN ha de ser de 13 digits' });
  }

  const duplicate = db.prepare('SELECT id FROM Books WHERE isbn = ?').get(cleanIsbn);
  if (duplicate) {
    return res.status(409).json({ error: 'Ja existeix un llibre amb aquest ISBN' });
  }

  const result = db
    .prepare(
      `INSERT INTO Books (title, author, isbn, copies_total, copies_available, status)
       VALUES (?, ?, ?, ?, ?, 'Disponible')`
    )
    .run(title.trim(), author.trim(), cleanIsbn, copiesTotal, copiesTotal);

  const book = db.prepare('SELECT * FROM Books WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(book);
});

app.get('/api/reservations', authMiddleware, (req, res) => {
  const reservations = db
    .prepare(
      `SELECT r.id, r.status, r.created_at, r.cancelled_at,
              b.id AS book_id, b.title, b.author, b.isbn, b.status AS book_status
       FROM Reservations r
       JOIN Books b ON b.id = r.book_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(req.user.id);
  res.json(reservations);
});

app.get('/api/reservations/active-count', authMiddleware, (req, res) => {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM Reservations WHERE user_id = ? AND status = 'Activa'")
    .get(req.user.id);
  res.json({ count: row.count, max: MAX_RESERVATIONS_PER_USER });
});

app.post('/api/reservations', authMiddleware, (req, res) => {
  const { bookId } = req.body;
  const parsedBookId = parseInt(bookId, 10);

  if (Number.isNaN(parsedBookId)) {
    return res.status(400).json({ error: 'ID de llibre invalid' });
  }

  const activeCount = db
    .prepare("SELECT COUNT(*) AS count FROM Reservations WHERE user_id = ? AND status = 'Activa'")
    .get(req.user.id);

  if (activeCount.count >= MAX_RESERVATIONS_PER_USER) {
    return res.status(409).json({
      error: `Has arribat al limit de ${MAX_RESERVATIONS_PER_USER} reserves actives`
    });
  }

  const book = db.prepare('SELECT * FROM Books WHERE id = ?').get(parsedBookId);
  if (!book) {
    return res.status(404).json({ error: 'Llibre no trobat' });
  }

  if (book.copies_available < 1) {
    return res.status(409).json({ error: 'Llibre no disponible' });
  }

  const existingReservation = db
    .prepare(
      "SELECT id FROM Reservations WHERE user_id = ? AND book_id = ? AND status = 'Activa'"
    )
    .get(req.user.id, parsedBookId);

  if (existingReservation) {
    return res.status(409).json({ error: 'Ja tens una reserva activa per aquest llibre' });
  }

  const createReservation = db.transaction(() => {
    const update = db
      .prepare(
        'UPDATE Books SET copies_available = copies_available - 1 WHERE id = ? AND copies_available > 0'
      )
      .run(parsedBookId);

    if (update.changes === 0) {
      throw new Error('NO_STOCK');
    }

    syncBookStatus(parsedBookId);

    const result = db
      .prepare("INSERT INTO Reservations (user_id, book_id, status) VALUES (?, ?, 'Activa')")
      .run(req.user.id, parsedBookId);

    return result.lastInsertRowid;
  });

  try {
    const reservationId = createReservation();
    const reservation = db
      .prepare(
        `SELECT r.*, b.title, b.author, b.isbn, b.status AS book_status
         FROM Reservations r
         JOIN Books b ON b.id = r.book_id
         WHERE r.id = ?`
      )
      .get(reservationId);

    res.status(201).json(reservation);
  } catch (err) {
    if (err.message === 'NO_STOCK') {
      return res.status(409).json({ error: 'Llibre no disponible' });
    }
    res.status(500).json({ error: 'Error en crear la reserva' });
  }
});

app.delete('/api/reservations/:id', authMiddleware, (req, res) => {
  const reservationId = parseInt(req.params.id, 10);
  if (Number.isNaN(reservationId)) {
    return res.status(400).json({ error: 'ID de reserva invalid' });
  }

  const reservation = db.prepare('SELECT * FROM Reservations WHERE id = ?').get(reservationId);

  if (!reservation) {
    return res.status(404).json({ error: 'Reserva no trobada' });
  }

  if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No pots cancel·lar aquesta reserva' });
  }

  if (reservation.status === 'Cancelada') {
    return res.status(409).json({ error: 'La reserva ja esta cancel·lada' });
  }

  if (reservation.status !== 'Activa') {
    return res.status(409).json({ error: 'Nomes es poden cancel·lar reserves actives' });
  }

  const cancelReservation = db.transaction(() => {
    db.prepare(
      "UPDATE Reservations SET status = 'Cancelada', cancelled_at = datetime('now') WHERE id = ?"
    ).run(reservationId);

    db.prepare('UPDATE Books SET copies_available = copies_available + 1 WHERE id = ?').run(
      reservation.book_id
    );

    syncBookStatus(reservation.book_id);
  });

  cancelReservation();

  const updated = db
    .prepare(
      `SELECT r.*, b.title, b.author, b.isbn, b.status AS book_status, b.copies_available
       FROM Reservations r
       JOIN Books b ON b.id = r.book_id
       WHERE r.id = ?`
    )
    .get(reservationId);

  res.json({ message: 'Reserva cancel·lada', reservation: updated });
});

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint no trobat' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log('Admin per defecte: admin@biblioteca.cat / Admin123!');
});
