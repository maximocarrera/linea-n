import { ArrowLeft, X } from 'lucide-react';

/**
 * Barra superior de las pantallas de juego: salir (48×48, con nombre accesible),
 * contenido central y un slot a la derecha. `confirmText` pide confirmación antes de salir.
 */
export default function GameHeader({ onExit, exitLabel = 'Salir', variant = 'close', confirmText, children, right }) {
  const Icon = variant === 'back' ? ArrowLeft : X;
  const handleExit = () => {
    if (!confirmText || window.confirm(confirmText)) onExit();
  };
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={handleExit} className="icon-btn shrink-0 cursor-pointer" aria-label={exitLabel}>
        <Icon className="size-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      {right}
    </div>
  );
}

/** Indicador de conexión (texto + punto, no solo color). */
export function ConnectionPill({ connected }) {
  return (
    <span role="status" className="flex shrink-0 items-center gap-2 border-2 border-rail px-3 py-1.5 text-sm font-semibold">
      <span className={`size-2.5 rounded-full ${connected ? 'live-dot bg-line-d' : 'animate-pulse bg-alert'}`} aria-hidden />
      {connected ? 'En línea' : 'Reconectando…'}
    </span>
  );
}
