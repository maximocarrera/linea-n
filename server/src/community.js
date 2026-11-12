import { randomUUID } from 'node:crypto';
import { MAX_ANSWER, SUGGESTION_MAX, SUGGESTION_MIN } from '@linean/shared';

/**
 * Límite de pedidos por clave (IP) en una ventana de tiempo. En memoria: alcanza con
 * una sola réplica (como en Railway). Devuelve true si el pedido entra.
 */
export function rateLimiter({ max, windowMs }) {
  const hits = new Map(); // clave -> [timestamps]
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, list] of hits) {
      const fresh = list.filter((t) => t > cutoff);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }, windowMs).unref();

  return (key) => {
    const now = Date.now();
    const list = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (list.length >= max) {
      hits.set(key, list);
      return false;
    }
    list.push(now);
    hits.set(key, list);
    return true;
  };
}

// Caracteres de control (salvo el salto de línea), de ancho cero y de dirección (bidi):
// no aportan nada a una sugerencia y sirven para ensuciar la consola o disfrazar texto.
const INVISIBLE = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g;

/** Limpia texto libre de un jugador. Devuelve '' si no es texto. */
export function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLE, '')
    .replace(/[^\S\n]+/g, ' ') // espacios repetidos/tabs → un espacio
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n') // como mucho una línea en blanco
    .trim()
    .slice(0, max);
}

/** Valida una sugerencia. Devuelve { text } o { error }. */
export function parseSuggestion(body) {
  if (typeof body?.text !== 'string') return { error: 'Escribí tu sugerencia.' };
  if (body.text.length > SUGGESTION_MAX * 2) return { error: `Máximo ${SUGGESTION_MAX} caracteres.` };
  const text = cleanText(body.text, SUGGESTION_MAX + 1);
  if (text.length < SUGGESTION_MIN) return { error: 'Contanos un poco más.' };
  if (text.length > SUGGESTION_MAX) return { error: `Máximo ${SUGGESTION_MAX} caracteres.` };

  let questionId = null;
  if (body.questionId != null) {
    questionId = Number(body.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0) return { error: 'Pregunta inválida.' };
  }
  return { text, questionId };
}

/**
 * Partidas solo en curso. El modo solo puntúa en el navegador, así que para contar sus
 * respuestas en las estadísticas cada partida lleva un ticket de un solo uso: solo se
 * aceptan las preguntas que el server mandó en esa partida, una vez cada una, y el server
 * vuelve a validar el texto. Si el resultado llega dos veces, se devuelve el mismo resumen
 * sin volver a contar.
 */
export class SoloTickets {
  constructor({ ttlMs = 2 * 60 * 60_000, maxOpen = 20_000 } = {}) {
    this.ttlMs = ttlMs;
    this.maxOpen = maxOpen;
    this.tickets = new Map(); // id -> { ids: number[], expires, summary }
    setInterval(() => this.sweep(), 10 * 60_000).unref();
  }

  open(questionIds) {
    if (this.tickets.size >= this.maxOpen) this.sweep();
    if (this.tickets.size >= this.maxOpen) this.tickets.delete(this.tickets.keys().next().value); // el más viejo
    const id = randomUUID();
    this.tickets.set(id, { ids: questionIds, expires: Date.now() + this.ttlMs, summary: null });
    return id;
  }

  get(id) {
    const t = typeof id === 'string' ? this.tickets.get(id) : undefined;
    return t && t.expires > Date.now() ? t : undefined;
  }

  sweep() {
    const now = Date.now();
    for (const [id, t] of this.tickets) if (t.expires <= now) this.tickets.delete(id);
  }
}

/** Convierte el cuerpo de /results en { questionId: textoIngresado } (solo ids del ticket). */
export function parsePlays(body, allowedIds) {
  const allowed = new Set(allowedIds);
  const plays = new Map();
  const list = Array.isArray(body?.plays) ? body.plays.slice(0, allowedIds.length) : [];
  for (const p of list) {
    const id = Number(p?.id);
    if (!allowed.has(id) || plays.has(id)) continue;
    const text = cleanText(p?.text, MAX_ANSWER).replace(/\n/g, ' ');
    if (text) plays.set(id, text);
  }
  return plays;
}
