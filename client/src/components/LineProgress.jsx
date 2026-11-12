import { TERMINAL_STATION, tierFor } from '@linean/shared';

/** Mapa de la línea: una estación por pregunta, de "Origen" a la cabecera. El tren avanza con transform. */
export default function LineProgress({ total, current, marks = [] }) {
  const clamped = Math.min(Math.max(current, 0), total - 1);
  const ratio = total > 1 ? clamped / (total - 1) : 0;

  return (
    <div>
      <div className="relative h-12" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={clamped + 1} aria-label={`Estación ${clamped + 1} de ${total}`}>
        <div className="absolute inset-x-4 inset-y-0">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-white/10" />
          <div className="absolute inset-x-0 top-1/2 h-2 origin-left -translate-y-1/2 bg-signal transition-transform duration-700 ease-train" style={{ transform: `scaleX(${ratio})` }} />

          <ol className="absolute -inset-x-[8px] inset-y-0 flex items-center justify-between">
            {Array.from({ length: total }, (_, i) => {
              const tier = tierFor(marks[i] ?? 0);
              const done = i < current;
              const now = i === current;
              const last = i === total - 1;
              return (
                <li key={i} className="relative grid place-items-center">
                  {now && <span className="absolute size-4 animate-ping-ring rounded-full bg-signal" />}
                  <span
                    className={`relative block border-[3px] transition-colors duration-500 ${last ? 'size-5 rotate-45' : 'size-4 rounded-full'} ${
                      now ? 'border-signal bg-tunnel' : done ? 'border-white/40 bg-white/25' : last ? 'border-signal/60 bg-tunnel' : 'border-white/25 bg-tunnel'
                    }`}
                    style={tier ? { backgroundColor: tier.color, borderColor: tier.color } : undefined}
                  />
                </li>
              );
            })}
          </ol>

          <div className="pointer-events-none absolute inset-x-0 top-0 transition-transform duration-700 ease-train" style={{ transform: `translateX(${ratio * 100}%)` }}>
            <TrainIcon className="-translate-x-1/2 -translate-y-1.5" />
          </div>
        </div>
      </div>
      <div className="flex justify-between px-1 font-mono text-xs text-mute" aria-hidden>
        <span>Origen</span>
        <span className="text-signal">{TERMINAL_STATION}</span>
      </div>
    </div>
  );
}

function TrainIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-6 drop-shadow ${className}`} aria-hidden>
      <rect x="4" y="2" width="16" height="16" rx="3" fill="#f4f2ea" />
      <rect x="6.5" y="5" width="11" height="5" rx="1" fill="#0b0d12" />
      <circle cx="8.5" cy="14" r="1.4" fill="#ffd400" />
      <circle cx="15.5" cy="14" r="1.4" fill="#ffd400" />
      <path d="M7 18l-2 4M17 18l2 4" stroke="#f4f2ea" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
