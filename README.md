# 🚇 Línea N

Trivia web de **respuestas raras** con temática de estación de subte. Cada partida tiene 10 estaciones (preguntas). Cada pregunta acepta muchas respuestas válidas, y **cuanto más de nicho es la tuya, más puntos sumás** (Brasil = 10, Benín = 100).

- **Viaje solo:** llegá a **700 pts** en 10 estaciones.
- **Multijugador:** salas con código de 4 letras, todos responden la misma pregunta a la vez y gana quien acumula más puntos.

## Stack

| Parte | Tecnología |
| --- | --- |
| Cliente | Vite 7 + React 19 + Tailwind CSS 4 |
| Animaciones | Keyframes CSS y Web Animations API, solo `transform`/`opacity` (compuestas en GPU) |
| Servidor | Node.js + Express 5 + Socket.io 4 (autoritativo: valida respuestas y lleva el tiempo) |
| Lógica compartida | `@linean/shared`: preguntas, normalización, tolerancia a typos y puntaje |

## Estructura

```
LineaN/
├─ package.json            # npm workspaces + scripts raíz
├─ shared/                 # lógica común cliente/servidor
│  └─ src/
│     ├─ constants.js      # reglas: 10 preguntas, meta 700, 20 s por ronda, tiers de rareza
│     ├─ normalize.js      # tildes/mayúsculas/artículos + Levenshtein
│     ├─ scoring.js        # matchAnswer, highlightAnswers, shuffle
│     └─ question-model.js # buildQuestion: fila de la base / JSON de la API → pregunta jugable
├─ server/
│  ├─ data/linean.db       # 📚 base SQLite con las preguntas (se edita a mano)
│  ├─ db/
│  │  ├─ schema.sql        # tablas questions / answers + vista question_overview
│  │  ├─ seed.js           # carga inicial (npm run db:seed)
│  │  └─ seed-data.js      # las 12 preguntas originales
│  └─ src/
│     ├─ index.js          # Express + Socket.io + GET /api/solo-game
│     ├─ db.js             # node:sqlite + QuestionStore (elige preguntas sin repetir)
│     ├─ handlers.js       # eventos de socket y validación de entrada
│     └─ rooms.js          # Room (máquina de estados) y RoomManager
└─ client/
   ├─ index.html           # viewport-fit=cover, theme-color, fuentes
   ├─ vite.config.js       # proxy /socket.io → :3001, host expuesto a la LAN
   └─ src/
      ├─ App.jsx           # enrutado por estado (home / solo / lobby / juego / resultados)
      ├─ index.css         # tokens de Tailwind, azulejos, keyframes (tren, cuenta regresiva…)
      ├─ lib/              # socket, storage seguro, useRoom, useRoundClock
      ├─ components/       # StationSign, LineProgress, TrainTransition, CountdownBar, AnswerInput…
      └─ screens/          # Home, SoloGame, Lobby, MultiGame, Results
```

## Desarrollo

```bash
npm install
npm run db:seed   # solo la primera vez: crea server/data/linean.db con las 12 preguntas
npm run dev
```

Requiere Node ≥ 22.13 (usa `node:sqlite`, que viene con Node: no hay que compilar nada).

- Cliente: http://localhost:5173
- Servidor: http://localhost:3001 (`/health` para chequear)
- **Probar en el celular:** misma red que la PC → abrí `http://<IP-de-la-PC>:5173` (Vite la muestra como "Network"; usá la `192.168.x.x`, no las de VPN como Hamachi/Radmin). La sala de espera ya muestra el link correcto aunque en la PC estés en `localhost`. Si el celular no carga, permití Node.js en el Firewall de Windows para redes **privadas**.
- **Vista previa de pantallas (solo dev):** `http://localhost:5173/?preview=lobby` (también `question`, `locked`, `reveal`, `podium`, `solo-win`, `solo-lose`) muestra cada pantalla con datos de ejemplo.
- `LINEAN_API_TARGET=http://localhost:3099` cambia el servidor al que Vite reenvía `/api` y `/socket.io`.

## Producción

```bash
npm run build   # genera client/dist
npm start       # el servidor sirve el cliente y los sockets en el mismo puerto (PORT, por defecto 3001)
```

`npm start` primero corre `db:import` (arma/actualiza la base desde `server/data/preguntas/*.txt`) y después levanta el servidor. `npm run build` además valida los `.txt`: si alguno tiene errores, el build falla y no se publica.

### Railway

`railway.json` ya define build (`npm run build`), arranque (`npm start`) y healthcheck (`/health`). Railway asigna `PORT` solo; Node 24 (campo `engines`).

1. Subí el proyecto a un repo de GitHub y en Railway: **New Project → Deploy from GitHub repo** (o `railway up` con la CLI).
2. En el servicio: **Settings → Networking → Generate Domain** para tener la URL pública.
3. Dejá **1 réplica**: las salas viven en memoria del proceso.
4. Para sumar preguntas en producción: editá los `.txt`, hacé push y Railway redeploya (el import corre solo).

La base `linean.db` no se versiona: se genera en cada arranque desde los `.txt`.

Si el cliente y el servidor viven en dominios distintos: `VITE_SERVER_URL` en el build del cliente y `CLIENT_ORIGIN` en el servidor.

## Herramientas de diseño

- **Skill `ui-ux-pro-max`** (en `.claude/skills/`): guía de UI/UX que Claude usa para el trabajo visual. Necesita Python 3.
- **MCP 21st (Magic):** configurado en `.mcp.json`. Necesita tu API key de https://21st.dev/mcp en la variable de entorno `API_KEY_21ST`. La key no se guarda en el repo.

## API HTTP

| Endpoint | Para qué |
| --- | --- |
| `GET /api/stats` | Portada: categorías activas, totales y algunas respuestas de nicho de muestra (caché de 30 s) |
| `GET /api/solo-game?exclude=…` | Las 10 preguntas de una partida solo |
| `GET /health` | Estado del servidor |

## Protocolo de sockets

| Cliente → Servidor | Respuesta (ack) |
| --- | --- |
| `room:create { name, playerId, recent }` | `{ ok, room }` |
| `room:join { code, name, playerId, recent }` | `{ ok, room }` o `{ error }` |
| `room:start` / `room:restart` (solo host) | `{ ok }` o `{ error }` |
| `answer:submit { text }` | `{ ok, display, points }` o `{ ok:false, reason: invalid \| locked \| closed }` |
| `room:leave` | — |

| Servidor → Cliente | Payload |
| --- | --- |
| `room:update` | snapshot de la sala (jugadores, host, estado) |
| `round:start` | pregunta pública (sin respuestas), `introMs`, `durationMs`, `answered`, `mine` |
| `round:progress` | ids de quienes ya respondieron |
| `round:end` | resultados de la ronda, respuestas de nicho, scoreboard |
| `game:over` | ranking final |

Los tiempos viajan como **duraciones relativas**, no como timestamps, para que no importe si el reloj del celular está desfasado. El `playerId` queda guardado en `localStorage`, así que si el celu se bloquea o pierde señal, vuelve a entrar a la misma sala con su puntaje.

## Cargar preguntas (archivos de texto)

La forma recomendada: **un archivo `.txt` por pregunta** en `server/data/preguntas/`, y después `npm run db:import`.

```
categoria: Fútbol
consigna: Nombrá un jugador que haya jugado en la Selección Argentina
activa: si
apellidos: si

[10]
Lionel Messi | Leo Messi
[100]
Pedro Pasculli
```

- Un nombre por renglón; variantes con `|`. Niveles `[10] [30] [60] [100]` (o `[comun] [poco] [rara] [nicho]`). Líneas con `#` son comentarios.
- `apellidos: si` agrega el apellido como alias cuando no es ambiguo ("Messi" sí; "Martínez" no si hay varios).
- `npm run db:import` valida todo (errores con número de línea, duplicados) y carga. Se puede correr las veces que quieras: cada archivo reemplaza las respuestas de **su** pregunta.
- `npm run db:import -- --check` solo valida · `npm run db:import -- seleccion` solo los archivos que contengan "seleccion".
- `npm run db:categorias` lista las preguntas cargadas agrupadas por categoría, con su estado (activa / inactiva / sin respuestas).
- `npm run db:export` crea archivos para las preguntas que estén en la base y todavía no tengan uno.

## Base de preguntas (SQLite)

Abrí `server/data/linean.db` con cualquier editor visual de SQLite (DB Browser for SQLite, TablePlus, DBeaver…).

**`questions`**

| columna | qué es |
| --- | --- |
| `id` | autonumérico |
| `category` | categoría visible, ej. `Geografía` |
| `prompt` | la consigna, ej. `Nombrá un país que empiece con B` |
| `active` | `1` = se juega, `0` = pausada (no se borra) |

**`answers`**

| columna | qué es |
| --- | --- |
| `id` | autonumérico |
| `question_id` | a qué pregunta pertenece |
| `answer` | respuesta principal (la que se muestra), ej. `Benín` |
| `aliases` | variantes separadas por `\|`, ej. `Benin\|Dahomey` (opcional) |
| `points` | 10 común · 30 poco común · 60 rara · 100 de nicho (cualquier entero > 0) |

- No hace falta cargar variantes con/sin tilde, mayúsculas ni artículos ("La Pampa" = "pampa"); tampoco errores de tipeo chicos. Eso lo resuelve `normalize.js`.
- La vista **`question_overview`** muestra cuántas respuestas tiene cada pregunta por nivel de rareza.
- Los cambios se ven en la **próxima partida**, sin reiniciar el servidor. Guardá (“Write changes”) en el editor para que el juego los lea.
- `npm run db:seed -- --reset` borra todo y vuelve a cargar las 12 preguntas originales.
- Otra ubicación para la base: variable de entorno `LINEAN_DB=/ruta/a/linean.db`.

### Cómo se eligen las preguntas

- Cada partida tiene 10 preguntas **distintas** entre las activas que tienen al menos una respuesta.
- Cada navegador guarda en `localStorage` (`linean:recent`) los ids de las últimas 40 preguntas que jugó. Se evitan y, si no alcanzan las nuevas, se completa con las que se jugaron hace más tiempo.
- **Solo:** `GET /api/solo-game?exclude=…` devuelve únicamente las 10 preguntas de esa partida con sus respuestas, en formato compacto y comprimido con gzip. El puntaje se calcula en el navegador con la misma lógica de `shared`.
- **Multijugador:** cada jugador manda su historial al entrar a la sala, y el servidor evita la unión de todos. Las respuestas nunca llegan al cliente.

## Próximos pasos sugeridos

- Puntaje dinámico en multijugador: bonus si nadie más dio la misma respuesta.
- Validar también el modo solo en el servidor (`POST /api/solo/answer`) para no mandar las respuestas al navegador.
- Sonidos (llegada del tren, puertas) con Web Audio, precargados después del primer toque (requisito de iOS).
- PWA (manifest + service worker) para instalarlo en el celular.
- Para escalar a varias instancias: adapter de Redis para Socket.io.
