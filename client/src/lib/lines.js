// Colores de línea con buen contraste para letra blanca (badges, tablero, categorías).
export const BOARD_COLORS = ['#e5262f', '#1f5fbf', '#00a05a', '#7b3fa0', '#d9480f', '#0b7285', '#c2255c', '#5f3dc4'];

/** Color estable para una categoría (siempre la misma "línea"). */
export function lineColorFor(text = '') {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return BOARD_COLORS[h % BOARD_COLORS.length];
}
