import { BOARD_COLORS } from '../../lib/lines';
import LineBadge from '../LineBadge';
import CountUp from './CountUp';
import FlapText from './FlapText';

const MAX_ROWS = 6;

/** Tablero de "próximas salidas": una línea por categoría, leído de la base SQLite (/api/stats). */
export default function DepartureBoard({ stats, className = '' }) {
  const { status, data } = stats;
  const categories = data?.categories ?? [];
  const extra = categories.length - MAX_ROWS;

  return (
    <section aria-labelledby="board-title" aria-busy={status === 'loading'} className={`slab overflow-hidden ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b-2 border-rail bg-sign px-5 py-3">
        <h2 id="board-title" className="label-caps !text-signal">
          Próximas salidas
        </h2>
        <span className="font-mono text-xs text-mute">{status === 'ready' ? `${categories.length} ${categories.length === 1 ? 'línea' : 'líneas'}` : '— —'}</span>
      </header>

      {status === 'loading' && (
        <ul aria-hidden className="divide-y-2 divide-rail">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-4">
              <span className="size-7 shrink-0 animate-pulse rounded-full bg-white/10" />
              <span className="h-4 flex-1 animate-pulse bg-white/10" style={{ maxWidth: `${60 - i * 8}%` }} />
            </li>
          ))}
        </ul>
      )}

      {status === 'error' && <p className="px-5 py-6 text-mute">No pudimos leer el tablero: el servidor no responde. Probá recargar en un rato.</p>}

      {status === 'ready' && categories.length === 0 && <p className="px-5 py-6 text-mute">Todavía no hay preguntas activas en la base.</p>}

      {status === 'ready' && categories.length > 0 && (
        <>
          <ol className="divide-y-2 divide-rail">
            {categories.slice(0, MAX_ROWS).map((c, i) => (
              <li key={c.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3">
                <LineBadge line={c.name.charAt(0).toUpperCase()} color={BOARD_COLORS[i % BOARD_COLORS.length]} size="sm" />
                <span className="min-w-0">
                  <FlapText text={c.name.toUpperCase()} delay={200 + i * 90} className="block truncate text-lg font-bold tracking-tight" />
                  <span className="block truncate text-sm text-mute">
                    {c.questions} {c.questions === 1 ? 'pregunta' : 'preguntas'} · {c.answers} respuestas
                  </span>
                </span>
                <span className="font-mono text-xs font-bold whitespace-nowrap text-signal">ANDÉN {i + 1}</span>
              </li>
            ))}
          </ol>
          {extra > 0 && <p className="border-t-2 border-rail px-5 py-2 text-sm text-mute">+{extra} líneas más</p>}

          <dl className="grid grid-cols-3 border-t-2 border-rail bg-sign">
            {[
              ['Preguntas', data.questions],
              ['Respuestas', data.answers],
              ['Categorías', categories.length],
            ].map(([label, value], i) => (
              <div key={label} className={`px-4 py-3 sm:px-5 ${i ? 'border-l-2 border-rail' : ''}`}>
                <dt className="label-caps !text-[0.6875rem] !tracking-[0.1em]">{label}</dt>
                <dd className="mt-0.5 font-mono text-xl font-bold sm:text-2xl">
                  <CountUp value={value} />
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
