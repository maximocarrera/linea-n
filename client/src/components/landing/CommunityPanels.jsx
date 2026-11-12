import { ArrowUpRight, Coffee, MessageSquareText } from 'lucide-react';
import { TERMINAL_STATION } from '@linean/shared';
import SuggestionForm from '../SuggestionForm';

export const CAFECITO_URL = 'https://cafecito.app/lineanicho';

/** Buzón de sugerencias general: preguntas nuevas, respuestas que faltan, ideas. */
export function SuggestionBox() {
  return (
    <section aria-labelledby="buzon-title" className="slab bg-sign">
      <header className="flex items-center justify-between gap-3 border-b-2 border-rail px-5 py-3">
        <h2 id="buzon-title" className="label-caps flex items-center gap-2 !text-chalk">
          <MessageSquareText className="size-4 text-signal" aria-hidden /> Buzón de sugerencias
        </h2>
        <span className="font-mono text-xs text-mute">Atención al pasajero</span>
      </header>
      <div className="grid gap-4 p-5 sm:p-6">
        <p className="max-w-[52ch] text-mute">
          ¿Se te ocurre una pregunta, una respuesta que falta o algo para mejorar el viaje? Dejalo acá: lo leemos todo y las mejores ideas suman estaciones.
        </p>
        <SuggestionForm placeholder="Ej.: una pregunta de bandas de rock nacional de los 80" />
      </div>
    </section>
  );
}

/** Al pie de todo: invitación a bancar el proyecto con un cafecito. */
export function CafecitoPanel() {
  return (
    <section
      aria-labelledby="cafecito-title"
      className="relative overflow-hidden border-2 border-signal bg-platform shadow-[8px_8px_0_0_#000]"
    >
      <div className="safety-strip h-2" aria-hidden />
      <div className="grid gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:p-7">
        <span className="grid size-16 shrink-0 -rotate-3 place-items-center bg-signal text-tunnel shadow-[4px_4px_0_0_#000]" aria-hidden>
          <Coffee className="size-9" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="label-caps">Próxima parada · {TERMINAL_STATION}</p>
          <h2 id="cafecito-title" className="mt-1 text-2xl leading-tight font-bold tracking-tight uppercase sm:text-3xl">
            ¿Te gustó el viaje? <span className="text-signal">Bancanos con un cafecito.</span>
          </h2>
          <p className="mt-2 max-w-[56ch] text-mute">
            Línea N es un proyecto independiente. Cada cafecito paga el servidor y suma preguntas nuevas; el flat white de {TERMINAL_STATION}, por ahora, lo seguimos esperando.
          </p>
        </div>
        <a
          href={CAFECITO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="press group flex min-h-14 items-center justify-center gap-2 bg-signal px-6 font-bold text-tunnel uppercase"
          style={{ '--press-shadow': '#f4f2ea' }}
        >
          <Coffee className="size-5" aria-hidden />
          Invitar un cafecito
          <ArrowUpRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          <span className="sr-only">(abre cafecito.app en otra pestaña)</span>
        </a>
      </div>
    </section>
  );
}
