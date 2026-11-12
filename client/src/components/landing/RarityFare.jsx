import { tierFor } from '@linean/shared';

// Ejemplo fijo para explicar la regla de un vistazo.
const FARES = [
  { example: 'Brasil', points: 10 },
  { example: 'Bulgaria', points: 30 },
  { example: 'Botsuana', points: 60 },
  { example: 'Benín', points: 100 },
];

/** "Tarifa por rareza": explica el puntaje con barras que crecen (scaleX, GPU). */
export default function RarityFare({ className = '' }) {
  return (
    <section aria-labelledby="fare-title" className={`slab p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="fare-title" className="label-caps">
          Tarifa por rareza
        </h2>
        <p className="font-mono text-xs text-mute">Consigna: “Un país con B”</p>
      </div>

      <ul className="mt-5 grid gap-4">
        {FARES.map((f, i) => {
          const tier = tierFor(f.points);
          return (
            <li key={f.example} className="grid grid-cols-[5.75rem_minmax(0,1fr)_4.75rem] items-center gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_5.5rem]">
              <span className="truncate text-lg font-bold">{f.example}</span>
              <span className="relative h-3 bg-white/5" aria-hidden>
                <span
                  className="absolute inset-0 origin-left"
                  style={{
                    backgroundColor: tier.color,
                    transform: `scaleX(${f.points / 100})`,
                    animation: `grow-x 750ms cubic-bezier(.2,.8,.2,1) ${250 + i * 110}ms both`,
                  }}
                />
              </span>
              <span className="text-right leading-tight">
                <span className="block font-mono text-lg font-bold" style={{ color: tier.color }}>
                  +{f.points}
                </span>
                <span className="block text-xs text-mute">{tier.label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
