import { useState } from 'react';
import { Timer } from 'lucide-react';

/**
 * Barra de tiempo animada 100% por CSS (una sola animación de scaleX, sin re-renders).
 * Montala con `key` distinto en cada ronda. Avisa al lector de pantalla a los 10 y 5 segundos.
 */
export default function CountdownBar({ endsAt, totalMs, secondsLeft }) {
  const [anim] = useState(() => {
    const remaining = Math.max(0, endsAt - Date.now());
    return { remaining, from: totalMs ? Math.min(1, remaining / totalMs) : 1 };
  });
  const urgent = secondsLeft <= 5;

  return (
    <div className="flex items-center gap-3" role="timer" aria-label="Tiempo restante">
      <Timer className={`size-5 shrink-0 ${urgent ? 'text-alert' : 'text-mute'}`} aria-hidden />
      <div className="relative h-3 flex-1 overflow-hidden bg-white/10">
        <div
          className={`countdown-bar absolute inset-0 transition-colors duration-300 ${urgent ? 'bg-alert' : 'bg-signal'}`}
          style={{ '--from': anim.from, animationDuration: `${anim.remaining}ms` }}
        />
      </div>
      <span className={`w-12 text-right font-mono text-2xl font-bold tabular-nums ${urgent ? 'text-alert' : ''}`} aria-hidden>
        {secondsLeft}
        <span className="text-sm text-mute">s</span>
      </span>
      <span className="sr-only" aria-live="polite">
        {secondsLeft === 10 || secondsLeft === 5 ? `Quedan ${secondsLeft} segundos` : ''}
      </span>
    </div>
  );
}
