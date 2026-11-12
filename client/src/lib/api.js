import { buildQuestion } from '@linean/shared';

const BASE = import.meta.env.VITE_SERVER_URL || '';

/** Resumen de la base para la portada: { questions, answers, categories[], samples[] }. */
export async function fetchStats({ signal } = {}) {
  const res = await fetch(`${BASE}/api/stats`, { signal });
  if (!res.ok) throw new Error('Sin datos del servidor');
  return res.json();
}

/** Pide las preguntas de una partida solo, evitando las jugadas hace poco. */
export async function fetchSoloGame(recent = [], { signal } = {}) {
  const params = new URLSearchParams();
  if (recent.length) params.set('exclude', recent.join(','));
  const res = await fetch(`${BASE}/api/solo-game?${params}`, { cache: 'no-store', signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo conectar con el servidor.');
  return data.questions.map(buildQuestion).filter((q) => q.answers.length > 0);
}
