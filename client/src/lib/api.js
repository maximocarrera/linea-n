import { buildQuestion } from '@linean/shared';

const BASE = import.meta.env.VITE_SERVER_URL || '';

/** Resumen de la base para la portada: { questions, answers, categories[], samples[] }. */
export async function fetchStats({ signal } = {}) {
  const res = await fetch(`${BASE}/api/stats`, { signal });
  if (!res.ok) throw new Error('Sin datos del servidor');
  return res.json();
}

/** Pide las preguntas de una partida solo, evitando las jugadas hace poco. → { gameId, questions } */
export async function fetchSoloGame(recent = [], { signal } = {}) {
  const params = new URLSearchParams();
  if (recent.length) params.set('exclude', recent.join(','));
  const res = await fetch(`${BASE}/api/solo-game?${params}`, { cache: 'no-store', signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo conectar con el servidor.');
  return { gameId: data.gameId, questions: data.questions.map(buildQuestion).filter((q) => q.answers.length > 0) };
}

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo conectar con el servidor.');
  return data;
}

// Un solo envío por partida (React StrictMode o re-montajes pueden pedirlo dos veces).
const soloResults = new Map();

/** Manda lo que respondiste en la partida solo y devuelve el % real de la gente por pregunta. */
export function sendSoloResults(gameId, plays) {
  if (!soloResults.has(gameId)) {
    const p = postJson(`/api/solo-game/${encodeURIComponent(gameId)}/results`, { plays }).then((d) => d.rounds ?? []);
    p.catch(() => soloResults.delete(gameId)); // si falla, se puede reintentar
    soloResults.set(gameId, p);
  }
  return soloResults.get(gameId);
}

/** Buzón: { text, questionId?, website (campo trampa) }. */
export const sendSuggestion = (payload) => postJson('/api/suggestions', payload);
