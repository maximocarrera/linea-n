import { RECENT_LIMIT } from '@linean/shared';

/** Acepta "1,2,3" o [1,2,3] y devuelve ids enteros positivos (los últimos RECENT_LIMIT). */
export function parseIds(input) {
  const list = Array.isArray(input) ? input : String(input ?? '').split(',');
  return list
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(-RECENT_LIMIT);
}
