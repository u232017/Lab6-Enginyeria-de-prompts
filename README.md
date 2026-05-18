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

