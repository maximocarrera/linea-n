/**
 * Ordena de mayor a menor puntaje y asigna posición con empates
 * (ranking de competencia: 100, 100, 80 → 1, 1, 3).
 */
export function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'es'));
  let lastScore = null;
  let position = 0;
  return sorted.map((p, i) => {
    if (p.score !== lastScore) {
      position = i + 1;
      lastScore = p.score;
    }
    return { ...p, position };
  });
}
