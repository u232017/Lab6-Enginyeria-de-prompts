const API = '/api';

let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const userInfo = document.getElementById('userInfo');
const adminPanel = document.getElementById('adminPanel');

function showMessage(el, text, type = 'error') {
  el.textContent = text;
  el.className = `message ${type}`;
  el.classList.remove('hidden');
}

function hideMessage(el) {
  el.classList.add('hidden');
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function updateUI() {
  if (currentUser && token) {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userRole').textContent = currentUser.role;
    adminPanel.classList.toggle('hidden', currentUser.role !== 'admin');
    loadBooks();
    loadReservations();
    updateReservationCount();
  } else {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    userInfo.classList.add('hidden');
    adminPanel.classList.add('hidden');
  }
}

function saveSession(user, newToken) {
  currentUser = user;
  token = newToken;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateUI();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateUI();
}

async function updateReservationCount() {
  try {
    const { count } = await api('/reservations/active-count');
    document.getElementById('reservationCount').textContent = count;
  } catch {
    document.getElementById('reservationCount').textContent = '?';
  }
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('registerMessage');
  hideMessage(msg);
  const fd = new FormData(e.target);

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: fd.get('email'),
        password: fd.get('password'),
        confirmPassword: fd.get('confirmPassword')
      })
    });
    saveSession(data.user, data.token);
    showMessage(msg, 'Registre exitos! Ja estàs connectat.', 'success');
    e.target.reset();
  } catch (err) {
    showMessage(msg, err.message, 'error');
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('loginMessage');
  hideMessage(msg);
  const fd = new FormData(e.target);

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: fd.get('email'),
        password: fd.get('password')
      })
    });
    saveSession(data.user, data.token);
    showMessage(msg, 'Sessió iniciada correctament.', 'success');
  } catch (err) {
    showMessage(msg, err.message, 'error');
  }
});

document.getElementById('btnLogout').addEventListener('click', logout);

document.getElementById('addBookForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('addBookMessage');
  hideMessage(msg);
  const fd = new FormData(e.target);

  try {
    await api('/books', {
      method: 'POST',
      body: JSON.stringify({
        title: fd.get('title'),
        author: fd.get('author'),
        isbn: fd.get('isbn'),
        copies: fd.get('copies')
      })
    });
    showMessage(msg, 'Llibre afegit al catàleg.', 'success');
    e.target.reset();
    loadBooks();
  } catch (err) {
    showMessage(msg, err.message, 'error');
  }
});

async function loadBooks() {
  const tbody = document.getElementById('booksTableBody');
  const msg = document.getElementById('booksMessage');
  hideMessage(msg);

  try {
    const books = await api('/books');
    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No hi ha llibres al catàleg</td></tr>';
      return;
    }

    tbody.innerHTML = books
      .map((book) => {
        const canReserve = book.copies_available > 0 && book.status === 'Disponible';
        const statusClass = book.status === 'Disponible' ? 'disponible' : 'reservat';
        return `
          <tr>
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
            <td>${book.isbn}</td>
            <td>${book.copies_available} / ${book.copies_total}</td>
            <td><span class="status ${statusClass}">${book.status}</span></td>
            <td>
              ${
                canReserve
                  ? `<button type="button" data-book-id="${book.id}" class="btn-reserve">Reservar</button>`
                  : '<span class="empty">—</span>'
              }
            </td>
          </tr>`;
      })
      .join('');

    tbody.querySelectorAll('.btn-reserve').forEach((btn) => {
      btn.addEventListener('click', () => reserveBook(btn.dataset.bookId));
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Error en carregar</td></tr>';
    showMessage(msg, err.message, 'error');
  }
}

async function reserveBook(bookId) {
  const msg = document.getElementById('booksMessage');
  hideMessage(msg);

  try {
    await api('/reservations', {
      method: 'POST',
      body: JSON.stringify({ bookId: parseInt(bookId, 10) })
    });
    showMessage(msg, 'Reserva creada correctament.', 'success');
    loadBooks();
    loadReservations();
    updateReservationCount();
  } catch (err) {
    showMessage(msg, err.message, 'error');
  }
}

async function loadReservations() {
  const tbody = document.getElementById('reservationsTableBody');
  const msg = document.getElementById('reservationsMessage');
  hideMessage(msg);

  try {
    const reservations = await api('/reservations');
    const active = reservations.filter((r) => r.status === 'Activa');

    if (active.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No tens reserves actives</td></tr>';
      return;
    }

    tbody.innerHTML = active
      .map(
        (r) => `
        <tr>
          <td>${r.id}</td>
          <td>${escapeHtml(r.title)}</td>
          <td>${r.isbn}</td>
          <td><span class="status activa">${r.status}</span></td>
          <td>${formatDate(r.created_at)}</td>
          <td>
            <button type="button" class="danger btn-cancel" data-id="${r.id}">Cancel·lar</button>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('.btn-cancel').forEach((btn) => {
      btn.addEventListener('click', () => cancelReservation(btn.dataset.id));
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Error en carregar</td></tr>';
    showMessage(msg, err.message, 'error');
  }
}

async function cancelReservation(id) {
  const msg = document.getElementById('reservationsMessage');
  hideMessage(msg);

  try {
    await api(`/reservations/${id}`, { method: 'DELETE' });
    showMessage(msg, 'Reserva cancel·lada. El llibre torna a estar disponible.', 'success');
    loadBooks();
    loadReservations();
    updateReservationCount();
  } catch (err) {
    showMessage(msg, err.message, 'error');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' });
}

updateUI();
