/* ============================================================
   Biblio · sistema de reserves — frontend
   Cabeces a /api segons l'API existent. JWT a localStorage.
   ============================================================ */

const API = '/api';
const MAX_RESERVATIONS = 3;

let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// ─── DOM refs ───────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const authScreen = $('#authScreen');
const appShell = $('#appShell');
const adminLinks = $('#adminLinks');

// ─── API helper ─────────────────────────────────────────
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    // Token caducat o invàlid a meitat de sessió → logout i tornar a auth.
    if (res.status === 401 && token) {
      logout();
      toast('La sessió ha caducat. Torna a iniciar sessió.', 'error');
    }
    const err = new Error(data.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Desactiva un botó i hi mostra un text de càrrega mentre dura `fn`,
// per evitar dobles clics durant les peticions.
async function withButton(btn, label, fn) {
  if (!btn) return fn();
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = label;
  try {
    return await fn();
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

// ─── Session ────────────────────────────────────────────
function saveSession(user, newToken) {
  currentUser = user;
  token = newToken;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  enterApp();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showAuth();
}

function showAuth() {
  appShell.classList.add('hidden');
  authScreen.classList.remove('hidden');
}

function enterApp() {
  authScreen.classList.add('hidden');
  appShell.classList.remove('hidden');

  // user badge
  $('#userEmail').textContent = currentUser.email;
  $('#userRole').textContent = currentUser.role;
  $('#userAvatar').textContent = (currentUser.email[0] || '·').toUpperCase();

  // admin nav
  if (currentUser.role === 'admin') {
    adminLinks.classList.remove('hidden');
  } else {
    adminLinks.classList.add('hidden');
  }

  // initial route
  navigate(location.hash || '#catalog');
}

// ─── Toasts ─────────────────────────────────────────────
function toast(text, type = 'info', timeoutMs = 4500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="tx"></div><button type="button" class="x" aria-label="tancar">×</button>`;
  el.querySelector('.tx').textContent = text;
  el.querySelector('.x').addEventListener('click', () => el.remove());
  $('#toasts').appendChild(el);
  if (timeoutMs > 0) setTimeout(() => el.remove(), timeoutMs);
}

// ─── Routing (hash-based) ───────────────────────────────
const ROUTES = ['catalog', 'reservations', 'admin-books'];

function navigate(hash) {
  let route = (hash || '').replace('#', '');
  if (!ROUTES.includes(route)) route = 'catalog';
  if (route === 'admin-books' && currentUser?.role !== 'admin') route = 'catalog';

  // active link
  $$('.sb-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === route);
  });
  // view visibility
  $$('.view').forEach((v) => v.classList.remove('active'));
  const view = $(`#view-${route}`);
  if (view) view.classList.add('active');

  // load data per route
  if (route === 'catalog') loadCatalog();
  if (route === 'reservations') loadReservations();
  if (route === 'admin-books') loadAdminBooks();
}

window.addEventListener('hashchange', () => navigate(location.hash));

// ─── Auth tabs ──────────────────────────────────────────
$$('.auth-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    $$('.auth-tab').forEach((b) => b.classList.toggle('active', b === btn));
    $('#loginForm').classList.toggle('hidden', tab !== 'login');
    $('#registerForm').classList.toggle('hidden', tab !== 'register');
  });
});

// ─── Auth handlers ──────────────────────────────────────
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = e.target.querySelector('button[type="submit"]');
  await withButton(btn, 'Entrant…', async () => {
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      });
      saveSession(data.user, data.token);
      toast(`Hola ${data.user.email}!`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
});

$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const btn = form.querySelector('button[type="submit"]');
  await withButton(btn, 'Creant…', async () => {
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
          confirmPassword: fd.get('confirmPassword'),
        }),
      });
      // El registre no inicia sessió (anti-enumeració): passem a login.
      toast(data.message || 'Registre processat. Ja pots iniciar sessió.', 'success');
      form.reset();
      $('.auth-tab[data-tab="login"]').click();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
});

$('#btnLogout').addEventListener('click', logout);

// ─── Catalog ────────────────────────────────────────────
let _allBooks = [];

async function loadCatalog() {
  const tbody = $('#catalogBody');
  tbody.innerHTML = `<tr><td colspan="7" class="empty">Carregant catàleg…</td></tr>`;
  try {
    _allBooks = await api('/books');
    renderCatalog();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderCatalog() {
  const tbody = $('#catalogBody');
  const q = $('#catalogSearch').value.trim().toLowerCase();
  const books = _allBooks.filter((b) => {
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.includes(q)
    );
  });

  $('#catalogCount').textContent = `${books.length} llibre${books.length === 1 ? '' : 's'}`;

  if (books.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No s'ha trobat cap llibre.</td></tr>`;
    return;
  }

  tbody.innerHTML = books
    .map((b) => {
      const canReserve = b.copies_available > 0 && b.status === 'Disponible';
      const statusTag =
        b.status === 'Disponible'
          ? `<span class="tag ok">Disponible</span>`
          : `<span class="tag warn">Reservat</span>`;
      return `
        <tr>
          <td><div class="cover-mini"></div></td>
          <td>
            <div class="title-cell">
              <div>
                <div class="row-title">${escapeHtml(b.title)}</div>
                <div class="meta">ID #${b.id}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(b.author)}</td>
          <td class="row-sub" style="font-family:var(--font-mark);font-size:13px">${escapeHtml(b.isbn)}</td>
          <td>${b.copies_available} / ${b.copies_total}</td>
          <td>${statusTag}</td>
          <td class="cell-actions">
            ${
              canReserve
                ? `<button class="btn sm primary" data-book="${b.id}" data-act="reserve">Reservar →</button>`
                : `<button class="btn sm" disabled>—</button>`
            }
          </td>
        </tr>`;
    })
    .join('');

  tbody.querySelectorAll('[data-act="reserve"]').forEach((btn) => {
    btn.addEventListener('click', () => reserveBook(btn.dataset.book, btn));
  });
}

$('#catalogSearch').addEventListener('input', () => {
  if (_allBooks.length) renderCatalog();
});

async function reserveBook(bookId, btn) {
  await withButton(btn, 'Reservant…', async () => {
    try {
      await api('/reservations', {
        method: 'POST',
        body: JSON.stringify({ bookId: parseInt(bookId, 10) }),
      });
      toast('Reserva creada.', 'success');
      loadCatalog();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ─── Reservations ───────────────────────────────────────
async function loadReservations() {
  const activeBox = $('#reservationsActive');
  const histBox = $('#reservationsHistory');
  activeBox.innerHTML = `<div class="empty">Carregant…</div>`;

  try {
    const reservations = await api('/reservations');
    const counts = await api('/reservations/active-count');
    $('#reservationsCount').textContent = `${counts.count} / ${counts.max} actives`;

    const active = reservations.filter((r) => r.status === 'Activa');
    const past = reservations.filter((r) => r.status !== 'Activa');

    if (active.length === 0) {
      activeBox.innerHTML = `<div class="empty">Sense reserves actives. Vés al <a href="#catalog">catàleg</a>.</div>`;
    } else {
      activeBox.innerHTML = active.map(reservationCard).join('');
      activeBox.querySelectorAll('[data-act="cancel"]').forEach((btn) => {
        btn.addEventListener('click', () => cancelReservation(btn.dataset.id, btn));
      });
    }

    if (past.length === 0) {
      histBox.innerHTML = `<div class="empty muted-line">Encara no hi ha històric.</div>`;
    } else {
      histBox.innerHTML = past.map(reservationCard).join('');
    }
  } catch (err) {
    activeBox.innerHTML = `<div class="empty">Error: ${escapeHtml(err.message)}</div>`;
    histBox.innerHTML = '';
  }
}

function reservationCard(r) {
  const isActive = r.status === 'Activa';
  const dateStr = formatDate(r.created_at);
  const cancelledStr = r.cancelled_at ? `· cancel·lada el ${formatDate(r.cancelled_at)}` : '';
  const statusTag = isActive
    ? `<span class="tag warn">Activa</span>`
    : `<span class="tag muted">${r.status}</span>`;

  return `
    <div class="card" style="margin-bottom:12px;${isActive ? '' : 'opacity:.6'}">
      <div style="display:flex;gap:14px;align-items:center">
        <div class="cover-mini" style="width:46px;height:64px"></div>
        <div style="flex:1;min-width:0">
          <div class="row-title ${isActive ? '' : 'strike'}">${escapeHtml(r.title)}</div>
          <div class="row-sub">${escapeHtml(r.author)} · ISBN <span style="font-family:var(--font-mark)">${escapeHtml(r.isbn)}</span></div>
          <div class="meta-line" style="margin-top:4px">Reservat ${dateStr} ${cancelledStr}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          ${statusTag}
          ${isActive ? `<button class="btn sm danger" data-act="cancel" data-id="${r.id}">Cancel·la →</button>` : ''}
        </div>
      </div>
    </div>`;
}

async function cancelReservation(id, btn) {
  if (!confirm('Cancel·lar aquesta reserva? El llibre tornarà a estar disponible.')) return;
  await withButton(btn, 'Cancel·lant…', async () => {
    try {
      await api(`/reservations/${id}`, { method: 'DELETE' });
      toast('Reserva cancel·lada. Llibre disponible.', 'success');
      loadReservations();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ─── Admin · books ──────────────────────────────────────
async function loadAdminBooks() {
  const tbody = $('#adminBooksBody');
  tbody.innerHTML = `<tr><td colspan="7" class="empty">Carregant…</td></tr>`;
  try {
    const books = await api('/books');
    $('#adminBookCount').textContent = `${books.length} llibres`;

    if (books.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty">El catàleg està buit. Afegeix-ne un →</td></tr>`;
      return;
    }
    tbody.innerHTML = books
      .map(
        (b) => `
      <tr>
        <td><div class="cover-mini"></div></td>
        <td>
          <div class="row-title">${escapeHtml(b.title)}</div>
          <div class="meta-line">ID #${b.id}</div>
        </td>
        <td>${escapeHtml(b.author)}</td>
        <td style="font-family:var(--font-mark);font-size:13px">${escapeHtml(b.isbn)}</td>
        <td>${b.copies_available} / ${b.copies_total}</td>
        <td>${b.status === 'Disponible' ? '<span class="tag ok">Disp.</span>' : '<span class="tag warn">Res.</span>'}</td>
        <td>${b.copies_total - b.copies_available}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

$('#addBookForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const btn = form.querySelector('button[type="submit"]');
  await withButton(btn, 'Desant…', async () => {
    try {
      await api('/books', {
        method: 'POST',
        body: JSON.stringify({
          title: fd.get('title'),
          author: fd.get('author'),
          isbn: fd.get('isbn'),
          copies: fd.get('copies'),
        }),
      });
      toast('Llibre afegit al catàleg.', 'success');
      form.reset();
      loadAdminBooks();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
});

// ─── Utils ──────────────────────────────────────────────
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

// ─── Boot ───────────────────────────────────────────────
(async function boot() {
  if (token && currentUser) {
    // verify token still valid
    try {
      const me = await api('/auth/me');
      currentUser = me.user;
      localStorage.setItem('user', JSON.stringify(currentUser));
      enterApp();
      return;
    } catch {
      // token expired/invalid
      logout();
      return;
    }
  }
  showAuth();
})();
