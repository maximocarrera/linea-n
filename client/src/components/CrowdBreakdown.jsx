import { useState } from 'react';
import { LoaderCircle, MessageSquarePlus, Users, X } from 'lucide-react';
import SuggestionForm from './SuggestionForm';

/** "32%", "<1%" para algo elegido muy pocas veces, "0%" si no hay datos. */
export function formatPct(picks, total) {
  if (!total || !picks) return '0%';
  const v = (picks / total) * 100;
  return v < 1 ? '<1%' : `${Math.round(v)}%`;
}

/**
 * Fin de partida: por cada pregunta, qué porcentaje REAL de la gente (todas las partidas
 * jugadas) eligió tu respuesta, cuál es la más elegida y un atajo para sugerir algo sobre esa pregunta.
 *
 * rounds: [{ id, category, prompt, total, top: [{answer, picks}], counts: {respuesta: picks}, mine }]
 * status: 'loading' | 'ready' | 'error'
 */
export default function CrowdBreakdown({ rounds = [], status = 'ready', delay = 0 }) {
  return (
    <section aria-labelledby="crowd-title" className="slab animate-slide-up overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <header className="border-b-2 border-rail bg-sign px-5 py-3">
        <h2 id="crowd-title" className="label-caps flex items-center gap-2 !text-signal">
          <Users className="size-4" aria-hidden /> Qué eligió la gente
        </h2>
        <p className="mt-1 text-sm text-mute">Porcentajes reales sobre todas las respuestas de todos los viajes.</p>
      </header>

      {status === 'loading' && (
        <p className="flex min-h-24 items-center justify-center gap-2 text-mute" role="status">
          <LoaderCircle className="size-5 animate-spin" aria-hidden /> Contando pasajeros…
        </p>
      )}
      {status === 'error' && (
        <p className="px-5 py-6 text-mute" role="status">
          No pudimos traer las estadísticas esta vez. Tu puntaje no cambia.
        </p>
      )}
      {status === 'ready' && rounds.length === 0 && <p className="px-5 py-6 text-mute">Sin estaciones para mostrar.</p>}
      {status === 'ready' && rounds.length > 0 && (
        <ol className="divide-y-2 divide-rail">
          {rounds.map((r, i) => (
            <CrowdRow key={r.id} round={r} index={i} delay={delay + 120 + i * 60} />
          ))}
        </ol>
      )}
    </section>
  );
}

function CrowdRow({ round, index, delay }) {
  const [suggesting, setSuggesting] = useState(false);
  const { total, top, counts, mine } = round;
  const minePicks = mine ? (counts?.[mine] ?? 0) : 0;
  const leader = top?.[0];
  const mineIsLeader = mine && leader?.answer === mine;
  const firstEver = mine && total === 1;

  return (
    <li className="grid animate-slide-up gap-3 px-5 py-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-sm text-mute">
          <span className="font-mono font-bold text-chalk">{String(index + 1).padStart(2, '0')}</span>
          <span className="mx-2" aria-hidden>·</span>
          {round.prompt}
        </p>
      </div>

      {mine ? (
        <div>
          <div className="flex items-end justify-between gap-3">
            <p className="min-w-0 truncate text-xl font-bold tracking-tight uppercase">{mine}</p>
            <p className="shrink-0 font-mono text-2xl font-bold text-signal tabular-nums">{formatPct(minePicks, total)}</p>
          </div>
          <PctBar picks={minePicks} total={total} delay={delay + 150} color="var(--color-signal)" />
          <p className="mt-1.5 text-sm text-mute">
            {firstEver
              ? 'Nadie la había respondido antes: abriste la estación.'
              : mineIsLeader
                ? `Es la más elegida: el ${formatPct(minePicks, total)} de la gente dio esta respuesta · ${total} en total.`
                : `El ${formatPct(minePicks, total)} de la gente eligió esta respuesta · ${total} en total.`}
          </p>
        </div>
      ) : (
        <p className="font-semibold text-mute">No llegaste a responder esta estación.</p>
      )}

      {leader && !mineIsLeader && !firstEver && (
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="label-caps">Más elegida</span>
          <span className="font-bold">{leader.answer}</span>
          <span className="font-mono text-mute">{formatPct(leader.picks, total)}</span>
        </p>
      )}
      {!mine && !leader && <p className="text-sm text-mute">Todavía nadie la respondió.</p>}

      {suggesting ? (
        <div className="grid animate-slide-up gap-2 border-l-4 border-signal pl-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">¿Le faltó algo a esta pregunta?</p>
            <button type="button" onClick={() => setSuggesting(false)} className="icon-btn cursor-pointer" aria-label="Cerrar sugerencia">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <SuggestionForm
            questionId={round.id}
            label="Tu sugerencia sobre esta estación"
            placeholder="Ej.: faltó el color Verde Agua"
            compact
            autoFocus
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSuggesting(true)}
          className="focus-ring -ml-2 flex min-h-12 w-fit cursor-pointer items-center gap-2 px-2 text-sm font-bold text-mute uppercase transition-colors hover:text-chalk"
        >
          <MessageSquarePlus className="size-4" aria-hidden /> Sugerir algo de esta pregunta
        </button>
      )}
    </li>
  );
}

function PctBar({ picks, total, delay, color }) {
  const ratio = total ? Math.max(picks / total, picks ? 0.02 : 0) : 0;
  return (
    <span className="relative mt-2 block h-2 bg-white/10" aria-hidden>
      <span
        className="absolute inset-0 origin-left"
        style={{ backgroundColor: color, transform: `scaleX(${ratio})`, animation: `grow-x 800ms cubic-bezier(.2,.8,.2,1) ${delay}ms both` }}
      />
    </span>
  );
}
