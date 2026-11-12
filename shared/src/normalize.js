const ARTICLES = /^(el|la|los|las|the)\s+/;

/** "  La Pampa! " -> "pampa", "Benín" -> "benin" */
export function normalize(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(ARTICLES, '');
}

/** Distancia de Levenshtein con corte temprano cuando supera `max`. */
export function levenshtein(a, b, max = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
}

/** Errores de tipeo tolerados según el largo de la respuesta esperada. */
export const typoTolerance = (len) => (len >= 8 ? 2 : len >= 5 ? 1 : 0);
