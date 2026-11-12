import { DoorClosed } from 'lucide-react';
import { tierFor } from '@linean/shared';
import TierChip from './TierChip';

/** Fin de ronda: tu resultado + (multi) lo que dijo cada uno + respuestas de nicho que existían. */
export default function RevealPanel({ prompt, mine, highlights, results, meId }) {
  const tier = mine ? tierFor(mine.points) : null;

  return (
    <section className="flex animate-slide-up flex-col gap-5" aria-label="Resultado de la estación">
      <p className="text-sm font-semibold text-mute">{prompt}</p>

      <div className="slab border-l-[6px] p-5" style={{ borderLeftColor: tier?.color ?? 'var(--color-rail)' }} role="status">
        {mine ? (
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="label-caps">Tu respuesta</p>
              <p className="mt-1 truncate text-3xl font-bold tracking-tight uppercase">{mine.display}</p>
              <TierChip points={mine.points} className="mt-3 inline-block" />
            </div>
            <p className="shrink-0 animate-pop-in font-mono text-5xl font-bold text-signal">+{mine.points}</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <DoorClosed className="size-10 shrink-0 text-mute" aria-hidden />
            <div>
              <p className="text-2xl font-bold uppercase">Se cerraron las puertas</p>
              <p className="text-sm text-mute">Sin respuesta en esta estación · +0</p>
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="slab overflow-hidden">
          <h2 className="label-caps border-b-2 border-rail bg-sign px-5 py-3">Así respondió el vagón</h2>
          <ul className="divide-y-2 divide-rail">
            {results.map((r, i) => (
              <li key={r.id} className="grid animate-slide-up grid-cols-[auto_minmax(0,6rem)_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="size-3 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
                <span className={`truncate font-bold ${r.id === meId ? 'text-signal' : ''}`}>
                  {r.name}
                  {r.id === meId && <span className="sr-only"> (vos)</span>}
                </span>
                <span className="truncate text-mute">{r.answer ?? '—'}</span>
                <TierChip points={r.points} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {highlights?.length > 0 && (
        <div>
          <h2 className="label-caps mb-3">Respuestas de nicho que existían</h2>
          <ul className="flex flex-wrap gap-2">
            {highlights.map((h, i) => (
              <li key={h.display} className="animate-pop-in border-2 border-rail bg-platform px-3 py-1.5 text-sm font-semibold" style={{ animationDelay: `${150 + i * 70}ms` }}>
                {h.display} <span className="ml-1 font-mono text-xs text-signal">+{h.points}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
