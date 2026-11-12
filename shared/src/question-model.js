import { normalize } from './normalize.js';

export const splitAliases = (value) =>
  String(value ?? '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Convierte una pregunta "cruda" (de la base o de la API) al formato que usa scoring.js:
 *   { id, category, prompt, answers: [{ display, keys: [normalizados], points }] }
 *
 * Cada respuesta puede venir como objeto { answer, aliases, points }
 * o como array compacto [answer, aliases, points] (lo que manda /api/solo-game).
 * Filas vacías, con puntaje inválido o duplicadas se ignoran.
 */
export function buildQuestion({ id, category, prompt, answers }) {
  const out = [];
  const seen = new Set();
  for (const raw of answers ?? []) {
    const [answer, aliases, points] = Array.isArray(raw) ? raw : [raw.answer, raw.aliases, raw.points];
    const names = [String(answer ?? '').trim(), ...splitAliases(aliases)].filter(Boolean);
    const pts = Number(points);
    if (!names.length || !Number.isFinite(pts) || pts <= 0) continue;
    const keys = [...new Set(names.map(normalize))].filter(Boolean);
    if (!keys.length || seen.has(keys[0])) continue;
    seen.add(keys[0]);
    out.push({ display: names[0], keys, points: pts });
  }
  return { id, category, prompt, answers: out };
}
