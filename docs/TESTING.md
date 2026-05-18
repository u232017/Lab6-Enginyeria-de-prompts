# Proves manuals — Sistema de Reserves de Biblioteca

Checklist pas a pas per validar les 4 històries d'usuari. Cada cas inclou
el comandament `curl` equivalent.

## Preparació

```bash
npm install
npm start
# Servidor a http://localhost:3000
```

Credencials sembrades automàticament amb la BD buida:

| Rol   | Correu                 | Contrasenya |
|-------|------------------------|-------------|
| admin | admin@biblioteca.cat   | Admin123!   |
| user  | julia@uni.cat          | Test1234    |

Per obtenir un token i reutilitzar-lo:

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"julia@uni.cat","password":"Test1234"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
```

---

## US-01 · Registre

### ✅ Registre nou correcte → 201
```bash
curl -i -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"nou@test.cat","password":"Prova123","confirmPassword":"Prova123"}'
```
Esperat: `201` amb `{ "message": "Registre processat..." }`.
**Nota:** el registre NO inicia sessió (anti-enumeració). Cal fer login després.

### ✅ Correu ja existent → 201 idèntic (no es filtra que existeix)
```bash
curl -i -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"julia@uni.cat","password":"Prova123","confirmPassword":"Prova123"}'
```
Esperat: `201` amb el **mateix** missatge que el cas anterior.

### ❌ Email amb format dolent → 400
```bash
curl -i -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"aixo-no-es-email","password":"Prova123","confirmPassword":"Prova123"}'
```
Esperat: `400` · `Format de correu invalid`.

### ❌ Contrasenya feble (< 8, sense dígit o sense lletra) → 400
```bash
curl -i -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"x@test.cat","password":"abc","confirmPassword":"abc"}'
```
Esperat: `400` · `La contrasenya ha de tenir minim 8 caracters...`.

### ❌ Contrasenyes que no coincideixen → 400
```bash
curl -i -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"x@test.cat","password":"Prova123","confirmPassword":"Altre123"}'
```
Esperat: `400` · `Les contrasenyes no coincideixen`.

---

## US-01 · Login

### ✅ Login correcte → 200 + token
```bash
curl -i -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"julia@uni.cat","password":"Test1234"}'
```
Esperat: `200` amb `{ user, token }`.

### ❌ Credencials dolentes → 401
```bash
curl -i -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"julia@uni.cat","password":"malament"}'
```
Esperat: `401` · `Credencials incorrectes`.

### ❌ Rate limit: 6è intent seguit → 429
```bash
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"x@x.cat","password":"dolent"}'
done
```
Esperat: cinc `401` i després `429` (5 intents / 15 min per IP).

---

## US-02 · Reservar

### ✅ Reserva correcta → 201
```bash
curl -i -X POST localhost:3000/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"bookId":1}'
```
Esperat: `201` amb la reserva. `copies_available` del llibre baixa en 1.

### ❌ Llibre ja reservat per tu → 409
Repeteix la mateixa crida.
Esperat: `409` · `Ja tens una reserva activa per aquest llibre`.

### ❌ Llibre sense còpies → 409
Reserva un llibre amb 1 sola còpia (p.ex. *Pedra de tartera*) des de dos
usuaris diferents; la segona crida dona `409` · `Llibre no disponible`.

### ❌ Límit de 3 reserves actives → 409
Reserva 3 llibres diferents i intenta'n un 4t.
Esperat: `409` · `Has arribat al limit de 3 reserves actives`.

---

## US-03 · Alta de llibres (només admin)

```bash
ADMIN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@biblioteca.cat","password":"Admin123!"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
```

### ✅ Alta correcta com a admin → 201
```bash
curl -i -X POST localhost:3000/api/books \
  -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"La pell freda","author":"Albert Sánchez Piñol","isbn":"9788499300012","copies":2}'
```
Esperat: `201` amb el llibre creat.

### ❌ Alta com a user normal → 403
```bash
curl -i -X POST localhost:3000/api/books \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"X","author":"Y","isbn":"9780000000017","copies":1}'
```
Esperat: `403` · `Acces denegat: cal rol administrador`.

### ❌ ISBN duplicat → 409
Torna a enviar l'alta correcta amb el mateix ISBN.
Esperat: `409` · `Ja existeix un llibre amb aquest ISBN`.

### ❌ ISBN que no té 13 dígits → 400
```bash
curl -i -X POST localhost:3000/api/books \
  -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"X","author":"Y","isbn":"123","copies":1}'
```
Esperat: `400` · `ISBN ha de ser de 13 digits`.

---

## US-04 · Cancel·lació

### ✅ Cancel·lar la teva reserva → 200
```bash
curl -i -X DELETE localhost:3000/api/reservations/1 \
  -H "Authorization: Bearer $TOKEN"
```
Esperat: `200`. `copies_available` del llibre torna a pujar en 1.

### ❌ Cancel·lar la reserva d'un altre usuari → 403
Amb el token de `julia`, intenta cancel·lar una reserva creada per un
altre usuari.
Esperat: `403` · `No pots cancel·lar aquesta reserva`.

### ❌ Cancel·lar una reserva ja cancel·lada → 409
Repeteix la cancel·lació anterior.
Esperat: `409` · `La reserva ja esta cancel·lada`.

---

## Robustesa

### JSON malformat → 400 (mai un 500 en HTML)
```bash
curl -i -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -d '{bad'
```
Esperat: `400` · `JSON invalid al cos de la peticio`.

### Endpoint inexistent → 404 JSON
```bash
curl -i localhost:3000/api/no-existeix
```
Esperat: `404` · `Endpoint no trobat`.

### Token caducat / invàlid → 401 i el frontend fa logout
A `app.js`, qualsevol resposta `401` amb token actiu neteja la sessió i
torna a la pantalla d'autenticació.
