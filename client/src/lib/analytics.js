// Eventos de Google Analytics (el script se carga en index.html).
// Si no cargó (bloqueador de anuncios, sin conexión), no pasa nada.
export function track(name, params = {}) {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // las estadísticas nunca rompen el juego
  }
}
