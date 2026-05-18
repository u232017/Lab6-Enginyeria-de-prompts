# Lab6-Enginyeria-de-prompts

## PRIMER PROMPT

Actua com un Desenvolupador Full-Stack Sènior expert en Node.js, Express i disseny d'APIs REST.

El teu objectiu és crear el codi complet i funcional per a un MVP (Producte Mínim Viable) d'un Sistema de Reserves de Biblioteca.

Aquestes són les especificacions tècniques que has d'utilitzar:
- Backend: Node.js amb Express.
- Base de dades: SQLite (utilitzant el paquet sqlite3 o better-sqlite3) per a una configuració zero.
- Frontend: HTML, CSS i JavaScript pur (Fetch API), servit des d'una carpeta public pel mateix servidor Express. No utilitzis frameworks tipus React o Vue per mantenir-ho simple.

L'aplicació ha d'implementar la lògica d'aquestes 4 Històries d'Usuari:
1. Registre d'usuaris (amb validació de correu, contrasenya hashejada amb bcrypt i rols 'user' o 'admin').
2. Reserva de llibres (un usuari només pot reservar si el llibre està 'Disponible', màxim 3 reserves per usuari, i l'estat del llibre passa a 'Reservat').
3. Alta de llibres (només usuaris amb rol 'admin' poden afegir llibres indicant Títol, Autor, ISBN i nombre d'exemplars).
4. Cancel·lació (l'usuari pot cancel·lar la seva reserva i el llibre torna a 'Disponible').

Si us plau, genera la següent sortida sense placeholders (vull el codi complet per poder executar-lo directament):

1. L'estructura de carpetes i els comandaments de terminal (npm init -y, npm install ...) necessaris per inicialitzar el projecte.
2. L'arxiu de configuració i creació de les taules de la base de dades SQLite (Taules: Users, Books, Reservations). Inclou un usuari administrador creat per defecte.
3. El codi del servidor (server.js) amb tots els endpoints de l'API REST (auth, llibres, reserves) i la lògica de negoci. Per simplificar en aquest MVP, pots fer servir una autenticació bàsica o simulada basada en un ID d'usuari (o JWT si ho veus factible i ràpid).
4. El codi del frontend (index.html i app.js) amb una interfície bàsica i funcional que permeti provar les 4 històries d'usuari cridant a l'API.

Pensa pas a pas abans d'escriure el codi per assegurar-te que les relacions entre la base de dades i els endpoints són coherents.

<img width="1311" height="873" alt="Screenshot 2026-05-18 at 15 53 46 (1)" src="https://github.com/user-attachments/assets/296fc225-5b8f-4394-bccb-5c6ad8e59fda" />

---

## MVP implementat

MVP del **Sistema de Reserves de Biblioteca** (Node.js + Express + SQLite).

Documentació de requisits: [docs/criteris-acceptacio.md](docs/criteris-acceptacio.md)

### Inicialització

```bash
npm install
npm start
```

Obre **http://localhost:3000**

### Credencials per defecte

| Rol   | Correu                 | Contrasenya  |
|-------|------------------------|--------------|
| Admin | admin@biblioteca.cat   | Admin123!    |

### API REST

| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| POST | /api/auth/register | Registre usuari |
| POST | /api/auth/login | Login (JWT) |
| GET | /api/books | Llistat llibres |
| POST | /api/books | Afegir llibre (admin) |
| GET | /api/reservations | Reserves de l'usuari |
| POST | /api/reservations | Crear reserva (màx. 3) |
| DELETE | /api/reservations/:id | Cancel·lar reserva |
