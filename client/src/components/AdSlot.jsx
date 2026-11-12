import { useEffect, useRef } from 'react';
import { useMediaQuery } from '../lib/useMediaQuery';

export const ADSENSE_CLIENT = 'ca-pub-3032830759957402';

// IDs de los bloques de anuncio (AdSense → Anuncios → Por bloque de anuncios).
// Se configuran en client/.env (y en las variables del servicio en Railway).
export const AD_SLOTS = {
  footer: import.meta.env.VITE_ADSENSE_SLOT_FOOTER,
  game: import.meta.env.VITE_ADSENSE_SLOT_GAME,
};

// Interruptor general. Mientras Google revisa el sitio, los bloques quedan apagados
// (el script de <head> sigue, que es lo que AdSense necesita para revisar).
// Para prenderlos: VITE_ADS_ENABLED=true en client/.env.production.
export const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';

/** Media query en la que hay lugar para el lateral fijo sin tocar la columna del juego. */
export const RAIL_QUERY = '(min-width: 1280px)';

/**
 * Bloque de AdSense. Reserva su alto antes de cargar (evita saltos de layout),
 * lleva el rótulo "Publicidad" y se oculta solo si Google no tiene anuncio para mostrar.
 * Sin slot configurado: en desarrollo muestra un recuadro de referencia; en producción no muestra nada.
 *
 *  - responsive: ancho del contenedor, alto automático (banner del footer)
 *  - width/height: tamaño fijo (lateral del juego)
 */
export default function AdSlot({ slot, width, height, minHeight = 90, className = '' }) {
  const insRef = useRef(null);
  const pushed = useRef(false);
  const fixed = Boolean(width && height);

  useEffect(() => {
    if (!slot || pushed.current || !insRef.current) return;
    pushed.current = true; // React StrictMode corre los efectos 2 veces en dev: un solo push por bloque
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* bloqueador de anuncios o script sin cargar: el juego sigue igual */
    }
  }, [slot]);

  if (!ADS_ENABLED) return null;
  if (!slot) {
    if (!import.meta.env.DEV) return null;
    return (
      <div className={`ad-slot ${className}`} aria-hidden>
        <p className="mb-1 text-center text-xs font-semibold tracking-wider text-mute uppercase">Publicidad</p>
        <div
          className="mx-auto grid place-items-center border-2 border-dashed border-rail px-3 text-center font-mono text-xs text-mute"
          style={fixed ? { width, height } : { minHeight }}
        >
          Bloque de anuncio · configurá su ID en client/.env
        </div>
      </div>
    );
  }

  return (
    <aside className={`ad-slot ${className}`} aria-label="Publicidad">
      <p className="mb-1 text-center text-xs font-semibold tracking-wider text-mute uppercase">Publicidad</p>
      <div className="mx-auto overflow-hidden" style={fixed ? { width, height } : { minHeight }}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={fixed ? { display: 'inline-block', width, height } : { display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          {...(fixed ? {} : { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' })}
        />
      </div>
    </aside>
  );
}

/** Lateral fijo para pantallas de juego en escritorio (≥1280px), fuera de la columna central. */
export function GameAdRail() {
  const wide = useMediaQuery(RAIL_QUERY);
  if (!wide || !ADS_ENABLED) return null;
  return (
    <div className="fixed top-1/2 right-6 z-0 -translate-y-1/2">
      <AdSlot slot={AD_SLOTS.game} width={300} height={250} />
    </div>
  );
}

/** Bloque al final de pantallas sin acción en curso (sala de espera, resultados). Solo celular/tablet. */
export function GameAdInline() {
  const wide = useMediaQuery(RAIL_QUERY);
  if (wide || !ADS_ENABLED) return null;
  return <AdSlot slot={AD_SLOTS.game} minHeight={100} className="mt-8 w-full pb-2" />;
}
