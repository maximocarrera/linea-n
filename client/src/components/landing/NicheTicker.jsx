const FALLBACK = [
  { answer: 'Benín', points: 100 },
  { answer: 'Tecnecio', points: 100 },
  { answer: 'San Pedrito', points: 100 },
  { answer: 'Theremín', points: 100 },
  { answer: 'Pangolín', points: 100 },
  { answer: 'Liubliana', points: 100 },
  { answer: 'Ocre', points: 100 },
  { answer: 'Fagot', points: 100 },
];

/**
 * Cinta decorativa con respuestas de nicho reales de la base.
 * Decorativa (aria-hidden), se pausa con hover y queda quieta con "reducir movimiento".
 */
export default function NicheTicker({ samples }) {
  const items = samples?.length >= 4 ? samples : FALLBACK;
  const row = (copy) => (
    <ul className="flex shrink-0 items-center gap-6 pr-6" aria-hidden={copy > 0 || undefined}>
      {items.map((s, i) => (
        <li key={`${copy}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-bold uppercase tracking-wide">{s.answer}</span>
          <span className="font-mono text-xs font-bold text-signal">+{s.points}</span>
          <span className="ml-4 size-1.5 rotate-45 bg-rail" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee overflow-hidden border-y-2 border-rail py-3" aria-hidden>
      <div className="marquee-track flex w-max">
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}
