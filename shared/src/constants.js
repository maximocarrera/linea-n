// Reglas de juego compartidas entre cliente (modo solo) y servidor (multijugador).

export const QUESTIONS_PER_GAME = 10;
export const TERMINAL_STATION = 'Chacagiales'; // cabecera: la meta del recorrido
export const SOLO_TARGET = 700;

export const ROUND_SECONDS = 20; // ventana para responder
export const INTRO_MS = 1400; // tren que pasa entre estaciones
export const REVEAL_MS = 5500; // pantalla de resultados de la ronda (multi)
export const SOLO_REVEAL_MS = 4500;

export const MAX_PLAYERS = 12;
export const MAX_NAME = 16;
export const MAX_ANSWER = 60;

// Buzón de sugerencias (landing y fin de partida).
export const SUGGESTION_MIN = 3;
export const SUGGESTION_MAX = 500;

// Cuántas preguntas jugadas recuerda cada navegador para no repetirlas pronto.
export const RECENT_LIMIT = 40;

// Tiers de rareza: cuanto más de nicho la respuesta, más puntos.
export const TIERS = [
  { min: 100, key: 'nicho', label: 'De nicho', color: '#ff3d7f' },
  { min: 60, key: 'rara', label: 'Rara', color: '#b16cff' },
  { min: 30, key: 'poco', label: 'Poco común', color: '#18b4e9' },
  { min: 1, key: 'comun', label: 'Común', color: '#9aa3b2' },
];

export const tierFor = (points) => (points > 0 ? TIERS.find((t) => points >= t.min) : null);

// Colores de línea para identificar jugadores.
export const LINE_COLORS = ['#18b4e9', '#e5262f', '#1f5fbf', '#00a05a', '#7b3fa0', '#ffc20e', '#ff7a1a', '#e64fa0', '#2ec4b6', '#a3c639', '#8d99ae', '#f25f5c'];
