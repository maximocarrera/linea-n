import { levenshtein, normalize, typoTolerance } from './normalize.js';

/**
 * Busca la respuesta del jugador en la lista de válidas.
 * Devuelve { display, points } o null si no es válida.
 */
export function matchAnswer(question, input) {
  const key = normalize(input);
  if (!key) return null;

  let best = null;
  let bestDist = Infinity;
  for (const answer of question.answers) {
    for (const k of answer.keys) {
      if (k === key) return { display: answer.display, points: answer.points };
      const tol = typoTolerance(k.length);
      if (!tol) continue;
      const d = levenshtein(k, key, tol);
      if (d <= tol && d < bestDist) {
        best = answer;
        bestDist = d;
      }
    }
  }
  return best ? { display: best.display, points: best.points } : null;
}

/** Lo que el cliente puede ver de una pregunta durante la ronda (sin respuestas). */
export function publicQuestion(q) {
  return { id: q.id, category: q.category, prompt: q.prompt, validCount: q.answers.length };
}

/** Respuestas para mostrar al final de la ronda: las más de nicho primero. */
export function highlightAnswers(q, count = 5, rng = Math.random) {
  return shuffle(q.answers, rng)
    .sort((a, b) => b.points - a.points)
    .slice(0, count)
    .map(({ display, points }) => ({ display, points }));
}

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
