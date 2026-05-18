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

Ara, hem canviat de Cursor amb Codex, a Claude design per millorar la qualitat de la aplicació.

## SEGON PROMPT

Li hem inserit el prompt anterior, y el document que ens ha proporcionat el professorat, i hem afegit:
"Quiero hacer dos versiones de diseño a partir de la versión 1"

Claude, ens ha preguntat un seguit de coses, i nosaltres li hem respòs:

**Questions answered:**
- que_es_versio_1: La 'versió 1' és el codi/funcionalitat del prompt — vull 2 wireframes diferents que la implementin visualment
- tipus_output: Mockups hi-fi (amb estils, colors, tipografia del design system)
- pantalles: Totes les anteriors
- dimensio_variacio: Explore a few options
- dispositiu: Desktop (web)
- estil_visual: Low-fi sketch (b&n, esbós, sense colors) — recomanat per wireframes
- idioma: Català
- tweaks: Decide for me

<img width="1600" height="869" alt="image" src="https://github.com/user-attachments/assets/d3612c0f-ce0c-4ec6-82d5-ded6ae43b716" />


## TERCER PROMPT
Passa tot aixo que hem fet a claude design a code. Aprofita el que ja esta fet en les versions anteriors

Questions answered:
- com_acces_repo: Et passo una URL de GitHub
- stack_real: No lo se mira-ho
- estat_repo: Mira-ho tu
- auth_tipus: Encara no decidit — tria tu
- ja_ports_ui: Decide for me
- fidelitat_visual: Polir-lo una mica (mantenir fonts handwritten però més net)
- extra: Necesito que lo hagas funcional i aproveches lo que esta hecho ya en el repo, tampoco debes complicarte mucho la vida porque solo tenemos un dia para hacer esto. Repo:https://github.com/u232017/Lab6-Enginyeria-de-prompts
![Uploading Captura de pantalla 2026-05-18 a las 16.56.56.png…]!<img width="1509" height="951" alt="Captura de pantalla 2026-05-18 a las 16 56 30" src="https://github.com/user-attachments/assets/e575ef60-4846-485e-899f-1423d033fc84" />
<img width="1512" height="945" alt="Captura de pantalla 2026-05-18 a las 16 56 40" src="https://github.com/user-attachments/assets/62d9e971-0f95-472d-a4e2-708c278a7cac" />
[Uploading Captura de pantalla 2026-05-18 a las 16.56.48.png…]()
()
<img width="1512" height="952" alt="Captura de pantalla 2026-05-18 a las 16 56 48" src="https://github.com/user-attachments/assets/dc9123b8-bbed-42a4-be32-cca18cc2a952" /><img width="1512" height="949" alt="Captura de pantalla 2026-05-18 a las 16 56 56" src="https://github.com/user-attachments/assets/1052977b-b9cc-443a-aff0-72d8d498b055" /># Lab6-Enginyeria-de-prompts

## CUART PROMPT

Actua com a Desenvolupador Full-Stack Sènior expert en Node.js, Express,
SQLite i seguretat d'APIs REST. La teva missió és deixar 100% funcional
i robust el MVP del Sistema de Reserves de Biblioteca.

CONTEXT DEL REPO

Estem treballant sobre el repo:
  github.com/u232017/Lab6-Enginyeria-de-prompts

Estructura actual:
  /server.js              ← API REST (Express + JWT)
  /db/database.js         ← Esquema SQLite + seed d'admin
  /data/biblioteca.db     ← BD (es genera sola)
  /public/index.html      ← Frontend (Versió B, sidebar + vistes)
  /public/styles.css      ← Sistema visual sketch refinat
  /public/app.js          ← Fetch contra /api, JWT a localStorage
  /package.json           ← Dependències: express, better-sqlite3,
                            bcrypt, jsonwebtoken, cors

QUÈ HA DE FER L'APP — 4 HISTÒRIES D'USUARI

US-01 — Registre
  Validació de correu (format), contrasenya ≥8 amb lletra + dígit,
  hash bcrypt, rol per defecte 'user'. Resposta: { user, token JWT }.

US-02 — Reserva
  Només si llibre està 'Disponible' i copies_available > 0.
  Màxim 3 reserves actives per usuari. No es pot reservar dues vegades
  el mateix llibre alhora. En reservar, copies_available--, i si
  arriba a 0 → status = 'Reservat'. Transacció atòmica.

US-03 — Alta de llibres (només admin)
  Camps: títol, autor, ISBN-13 (13 dígits), nº exemplars (≥1).
  ISBN únic. Middleware ha de bloquejar usuaris no admin.

US-04 — Cancel·lació
  Només la pot cancel·lar l'usuari propietari (o admin).
  Només si està 'Activa'. En cancel·lar, copies_available++,
  i status del llibre passa a 'Disponible' si queden còpies.
  Transacció atòmica.

LA TEVA FEINA

1) AUDITORIA I CORRECCIÓ DEL BACKEND
Llegeix server.js i db/database.js i verifica que:
- Totes les validacions són correctes (email, password, ISBN).
- Les transaccions per reservar/cancel·lar són realment atòmiques
  i no permeten races en SQLite.
- Els missatges d'error no filtren si un correu existeix
  (cas registre: response 409 sense dir "ja existeix" en text obert).
- syncBookStatus() es crida sempre que cal.
- adminMiddleware sempre va després d'authMiddleware.
- Tokens JWT caduquen i el frontend gestiona el 401 correctament.
- Hi ha un endpoint /api/auth/me que verifica el token al carregar.

Arregla tot allò que veguis fluix. Documenta els canvis en commit clars.

2) ROBUSTESA
Afegeix:
- Logger bàsic de peticions (mètode + path + status + ms).
- Manejador global d'errors no controlats (no llencis 500 sense JSON).
- Rate limit senzill per /api/auth/login (5 intents / 15 min per IP)
  usant un Map en memòria — res de Redis.
- CORS només permès per origen propi en producció (variable d'entorn).

3) SEED DE DADES DE PROVA
Quan arrenqui amb data/biblioteca.db buit, crea:
- L'admin per defecte (admin@biblioteca.cat / Admin123!) — ja existeix.
- Un usuari de prova: julia@uni.cat / Test1234 (rol 'user').
- 6–8 llibres reals catalans (Pla, Rodoreda, Cabré, Moncada, Barbal...)
  amb ISBNs vàlids de 13 dígits i diferents nº d'exemplars.

4) FRONTEND — VERIFICAR INTEGRACIÓ
El frontend ja està a /public (Versió B amb sidebar). NO el redissenyis.
Només cal:
- Comprovar que totes les crides de /public/app.js encaixen amb les
  respostes reals del backend (camps, status codes).
- Si el backend retorna 401 expirat → app.js ha de fer logout i
  tornar a la pantalla d'auth.
- Afegir un petit estat "carregant…" als botons durant les peticions
  perquè no es puguin clicar dos cops.

5) TESTS MANUALS
Crea /docs/TESTING.md amb un checklist pas a pas per provar:
  - Registre nou (èxit, email dolent, password feble, password no coincideix).
  - Login (èxit, credencials dolentes).
  - Reservar (èxit, llibre no disponible, ja reservat, límit 3 reserves).
  - Alta llibres (èxit com a admin, 403 com a user, ISBN duplicat,
    ISBN no de 13 dígits).
  - Cancel·lar (èxit, cancel·lar la d'un altre usuari → 403).
Inclou els comandaments curl per cada cas.

6) DOCS
Actualitza /README.md amb:
- Com arrencar (npm install, npm start).
- Endpoints disponibles (taula).
- Credencials de prova.
- Captura del frontend (pots referenciar /docs si cal).

NORMES
- Llenguatge: backend i UI en català (com ja està).
- No introdueixis nous frameworks. Stack actual: Express + better-sqlite3
  + bcrypt + jsonwebtoken + cors. Frontend vanilla.
- Commits petits i clars amb missatges en imperatiu.
- Si trobes alguna cosa al codi actual que és incorrecta o ambigua,
  ATURA'T i pregunta abans de canviar-la.
- Quan acabis, llença `npm start` i verifica que pots:
    1) registrar un usuari nou
    2) entrar com a admin i afegir un llibre
    3) entrar com a usuari i reservar-lo
    4) cancel·lar la reserva
  Tot dins el navegador, sense errors a la consola.

Pensa pas a pas abans de tocar res. Comença per la fase 1 (auditoria)
i mostra'm els problemes que detectes abans de corregir-los.
