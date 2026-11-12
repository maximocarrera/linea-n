import { RECENT_LIMIT } from '@linean/shared';
import { local } from './storage';

const KEY = 'linean:recent';

/** Ids de preguntas jugadas en este navegador, de la más vieja a la más nueva. */
export function getRecent() {
  const list = local.get(KEY, []);
  return Array.isArray(list) ? list.filter(Number.isInteger) : [];
}

export function rememberPlayed(...ids) {
  const fresh = ids.filter(Number.isInteger);
  if (!fresh.length) return;
  const list = getRecent().filter((id) => !fresh.includes(id));
  list.push(...fresh);
  local.set(KEY, list.slice(-RECENT_LIMIT));
}
