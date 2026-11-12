import express from 'express';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import compression from 'compression';
import { QUESTIONS_PER_GAME } from '@linean/shared';
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

// Modo solo: solo las preguntas (y respuestas) de ESTA partida, nunca la base entera.
// ?exclude=1,2,3 → ids jugados hace poco en este navegador (de más viejo a más nuevo).
app.get('/api/solo-game', (req, res) => {
  try {
    const questions = store.pickGame(QUESTIONS_PER_GAME, parseIds(req.query.exclude));
    if (!questions.length) return res.status(503).json({ error: 'No hay preguntas cargadas todavía.' });
    res.set('Cache-Control', 'no-store').json({ questions: questions.map(toWire) });
  } catch (err) {
    console.error('solo-game:', err);
    res.status(500).json({ error: 'No se pudo leer la base de preguntas.' });
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

// Si existe el build del cliente, lo servimos desde el mismo puerto (deploy en un solo proceso).
const dist = path.resolve(__dirname, '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

httpServer.listen(PORT, () => {
  console.log(`🚇 Línea N — servidor escuchando en el puerto ${PORT}${IS_PROD ? ' (producción)' : ` → http://localhost:${PORT}`}`);
});
