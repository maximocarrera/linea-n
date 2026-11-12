import { Check } from 'lucide-react';

/** Puntajes compactos durante la ronda. Quien ya respondió: borde amarillo + tilde (no solo color). */
export default function Scoreboard({ players, meId, answeredIds }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <ul className="flex flex-wrap gap-2">
      {sorted.map((p) => {
        const answered = answeredIds?.includes(p.id);
        return (
          <li
            key={p.id}
            className={`flex min-h-10 items-center gap-2 border-2 px-3 text-sm transition-[opacity,border-color] duration-300 ${answered ? 'border-signal' : 'border-rail'} ${
              p.connected ? '' : 'opacity-50'
            }`}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
            <span className={`max-w-28 truncate font-semibold ${p.id === meId ? 'text-signal' : ''}`}>
              {p.name}
              {p.id === meId && <span className="sr-only"> (vos)</span>}
            </span>
            <span className="font-mono text-mute tabular-nums">{p.score}</span>
            {answered && (
              <span className="animate-pop-in text-signal">
                <Check className="size-4" aria-hidden />
                <span className="sr-only">respondió</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
