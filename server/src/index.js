import express from 'express';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import compression from 'compression';
import { QUESTIONS_PER_GAME, buildQuestion, matchAnswer } from '@linean/shared';
import { SoloTickets, parsePlays, parseSuggestion, rateLimiter } from './community.js';
import { DB_PATH, QuestionStore, openDb, toWire } from './db.js';
import { parseIds } from './ids.js';
import { RoomManager } from './rooms.js';
import { registerSocketHandlers } from './handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Railway (y casi cualquier hosting) asigna el puerto en PORT. 3001 es solo para desarrollo local.
const PORT = Number(process.env.PORT) || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';
// En producción, definí CLIENT_ORIGIN=https://tu-dominio.com (separados por coma si hay varios)
const ORIGINS = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true;

const app = express();
// Detrás del proxy de Railway, la IP real del jugador viene en X-Forwarded-For (un salto).
// Se usa solo para los límites anti-spam.
if (IS_PROD) app.set('trust proxy', 1);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ORIGINS },
  // Pings más cortos: detecta rápido celulares que se quedan sin señal en el "túnel".
  pingInterval: 10_000,
  pingTimeout: 8_000,
});

const store = new QuestionStore(openDb());
const playable = store.countPlayable();
if (playable === 0) console.warn(`⚠ La base ${DB_PATH} no tiene preguntas activas. Corré: npm run db:seed`);
else console.log(`📚 ${playable} preguntas activas en ${DB_PATH}`);

const rooms = new RoomManager(io, store);
registerSocketHandlers(io, rooms);

app.use(compression());

app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size, questions: store.countPlayable() }));

// Límites por IP (anti-spam). Una partida solo dura ~4 min, así que estos números sobran para jugar.
const limits = {
  soloGame: rateLimiter({ max: 60, windowMs: 10 * 60_000 }),
  soloResults: rateLimiter({ max: 30, windowMs: 10 * 60_000 }),
  suggestion: rateLimiter({ max: 6, windowMs: 10 * 60_000 }),
  suggestionGlobal: rateLimiter({ max: 300, windowMs: 60 * 60_000 }), // tope total por hora
};
const tooMany = (res) => res.status(429).json({ error: 'Muchos pedidos seguidos. Probá de nuevo en unos minutos.' });
const tickets = new SoloTickets();
// JSON chico y solo en las rutas que lo necesitan.
const json = express.json({ limit: '4kb', strict: true });

// Modo solo: solo las preguntas (y respuestas) de ESTA partida, nunca la base entera.
// ?exclude=1,2,3 → ids jugados hace poco en este navegador (de más viejo a más nuevo).
app.get('/api/solo-game', (req, res) => {
  if (!limits.soloGame(req.ip)) return tooMany(res);
  try {
    const questions = store.pickGame(QUESTIONS_PER_GAME, parseIds(req.query.exclude));
    if (!questions.length) return res.status(503).json({ error: 'No hay preguntas cargadas todavía.' });
    const gameId = tickets.open(questions.map((q) => q.id));
    res.set('Cache-Control', 'no-store').json({ gameId, questions: questions.map(toWire) });
  } catch (err) {
    console.error('solo-game:', err);
    res.status(500).json({ error: 'No se pudo leer la base de preguntas.' });
  }
});

// Fin de partida solo: el server vuelve a validar cada respuesta, la cuenta en las
// estadísticas y devuelve qué porcentaje de la gente eligió cada una.
app.post('/api/solo-game/:gameId/results', json, (req, res) => {
  const ticket = tickets.get(req.params.gameId);
  if (!ticket) return res.status(404).json({ error: 'La partida expiró.' });
  if (ticket.summary) return res.set('Cache-Control', 'no-store').json({ rounds: ticket.summary });
  if (!limits.soloResults(req.ip)) return tooMany(res);
  try {
    const plays = parsePlays(req.body, ticket.ids);
    const questions = store.load(ticket.ids).map(buildQuestion);
    const mine = new Map();
    for (const q of questions) {
      const text = plays.get(q.id);
      const match = text ? matchAnswer(q, text) : null;
      if (match) {
        mine.set(q.id, match.display);
        store.recordPicks(q.id, [match.display]);
      }
    }
    ticket.summary = store
      .crowd(questions.map((q) => ({ id: q.id, category: q.category, prompt: q.prompt, chosen: [mine.get(q.id)] })))
      .map((r) => ({ ...r, mine: mine.get(r.id) ?? null }));
    res.set('Cache-Control', 'no-store').json({ rounds: ticket.summary });
  } catch (err) {
    console.error('solo-results:', err);
    res.status(500).json({ error: 'No se pudieron guardar los resultados.' });
  }
});

// Buzón de sugerencias. El texto se limpia, se limita y se guarda con una sentencia
// preparada (sin SQL armado a mano). Nunca se muestra en la web: se lee con npm run db:sugerencias.
app.post('/api/suggestions', json, (req, res) => {
  if (!limits.suggestion(req.ip) || !limits.suggestionGlobal('all')) return tooMany(res);
  // Campo trampa: invisible para personas; si viene lleno es un bot. Le decimos que sí y no guardamos nada.
  if (req.body?.website) return res.status(201).json({ ok: true });
  const parsed = parseSuggestion(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    if (!store.addSuggestion(parsed)) return res.status(400).json({ error: 'Esa pregunta no existe.' });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('suggestions:', err);
    res.status(500).json({ error: 'No se pudo guardar la sugerencia.' });
  }
});

// Portada: categorías y totales de la base (sin preguntas ni respuestas completas).
app.get('/api/stats', (_req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=30').json(store.stats());
  } catch (err) {
    console.error('stats:', err);
    res.status(500).json({ error: 'No se pudo leer la base de preguntas.' });
  }
});

// IPs de esta PC en la red local (para que el link de la sala sirva desde el celular
// aunque el host haya abierto el juego en "localhost"). Solo rangos privados: sin VPNs.
app.get('/api/network', (_req, res) => {
  // En producción no tiene sentido (el link ya es público) y no exponemos IPs internas del servidor.
  if (IS_PROD) return res.set('Cache-Control', 'no-store').json({ addresses: [] });
  const PRIVATE = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal && PRIVATE.test(a.address))
    .map((a) => a.address)
    .sort((a, b) => Number(!a.startsWith('192.168.')) - Number(!b.startsWith('192.168.')));
  res.set('Cache-Control', 'no-store').json({ addresses });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontrado' }));
// JSON mal formado u otro error de body-parser: respuesta corta, sin stack.
app.use('/api', (err, _req, res, _next) => res.status(err.status ?? 400).json({ error: 'Pedido inválido.' }));

// Si existe el build del cliente, lo servimos desde el mismo puerto (deploy en un solo proceso).
const dist = path.resolve(__dirname, '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

httpServer.listen(PORT, () => {
  console.log(`🚇 Línea N — servidor escuchando en el puerto ${PORT}${IS_PROD ? ' (producción)' : ` → http://localhost:${PORT}`}`);
});
