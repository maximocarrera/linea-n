import { useState } from 'react';
import { ArrowRight, LoaderCircle, Plus, Ticket, Users } from 'lucide-react';
import { MAX_NAME, QUESTIONS_PER_GAME, SOLO_TARGET } from '@linean/shared';

/** Boleto: nombre del pasajero + acciones (solo, crear sala, unirse). */
export default function TicketCard({ name, setName, initialCode, onSolo, onCreate, onJoin, busy, error, serial }) {
  const [code, setCode] = useState(initialCode ?? '');
  const [joining, setJoining] = useState(Boolean(initialCode));
  const hasName = name.trim().length > 0;
  const canJoin = hasName && code.length === 4 && !busy;

  return (
    <section aria-labelledby="ticket-title" className="slab relative bg-sign shadow-[8px_8px_0_0_#000]">
      <div className="flex items-center justify-between gap-3 border-b-2 border-rail px-5 py-3">
        <h2 id="ticket-title" className="label-caps flex items-center gap-2">
          <Ticket className="size-4" aria-hidden /> Boleto
        </h2>
        <span className="font-mono text-xs text-mute">Nº {serial}</span>
      </div>

      <div className="grid gap-6 p-5 sm:p-6">
        <div>
          <label htmlFor="player-name" className="label-caps">
            Pasajero
          </label>
          <input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
            placeholder="Tu nombre"
            autoComplete="nickname"
            enterKeyHint="done"
            aria-describedby="name-help"
            className="focus-ring mt-2 min-h-12 w-full border-2 border-rail bg-tunnel px-4 py-3 text-lg font-semibold outline-none transition-colors placeholder:text-mute/70 focus:border-signal"
          />
          <p id="name-help" className="mt-2 text-sm text-mute">
            {hasName ? 'Así te van a ver en la sala.' : 'Para jugar con amigos necesitás un nombre.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onSolo}
          className="press group flex min-h-18 cursor-pointer items-center justify-between gap-4 bg-signal px-5 py-4 text-left text-tunnel"
          style={{ '--press-shadow': '#f4f2ea' }}
        >
          <span>
            <span className="block text-2xl leading-none font-bold tracking-tight uppercase sm:text-3xl">Viaje solo</span>
            <span className="mt-1.5 block text-sm font-semibold">
              Meta {SOLO_TARGET} pts · {QUESTIONS_PER_GAME} estaciones
            </span>
          </span>
          <ArrowRight className="size-8 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </button>

        <div className="perforation -mx-5 h-2 sm:-mx-6" aria-hidden />

        <div>
          <p className="label-caps flex items-center gap-2">
            <Users className="size-4" aria-hidden /> Con amigos
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCreate}
              disabled={!hasName || busy}
              aria-describedby={hasName ? undefined : 'name-help'}
              className="press flex min-h-14 cursor-pointer items-center justify-center gap-2 border-2 border-chalk bg-platform-2 px-3 text-sm font-bold whitespace-nowrap uppercase sm:text-base disabled:cursor-not-allowed disabled:border-rail disabled:text-mute disabled:shadow-none"
              style={{ '--press-shadow': '#e5262f' }}
            >
              {busy && !joining ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Plus className="size-5" aria-hidden />}
              Crear sala
            </button>
            <button
              type="button"
              onClick={() => setJoining((j) => !j)}
              aria-expanded={joining}
              aria-controls="join-form"
              className={`press flex min-h-14 cursor-pointer items-center justify-center gap-2 border-2 px-3 text-sm font-bold whitespace-nowrap uppercase sm:text-base ${
                joining ? 'border-line-d bg-line-d text-white' : 'border-chalk bg-platform-2'
              }`}
              style={{ '--press-shadow': '#00a05a' }}
            >
              Unirse
            </button>
          </div>

          {joining && (
            <form
              id="join-form"
              className="mt-4 animate-slide-up"
              onSubmit={(e) => {
                e.preventDefault();
                if (canJoin) onJoin(code);
              }}
            >
              <label htmlFor="room-code" className="label-caps">
                Código de sala
              </label>
              <div className="mt-2 flex gap-3">
                <input
                  id="room-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                  placeholder="ABCD"
                  autoFocus={!initialCode}
                  autoCapitalize="characters"
                  autoComplete="off"
                  enterKeyHint="go"
                  inputMode="text"
                  className="focus-ring min-h-14 w-full min-w-0 border-2 border-rail bg-tunnel px-4 text-center font-mono text-2xl font-bold tracking-[0.45em] uppercase outline-none placeholder:text-mute/50 focus:border-line-d"
                />
                <button
                  type="submit"
                  disabled={!canJoin}
                  className="press flex min-h-14 shrink-0 cursor-pointer items-center gap-2 bg-line-d px-5 font-bold text-white uppercase disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  style={{ '--press-shadow': '#f4f2ea' }}
                >
                  {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : null}
                  Subir
                </button>
              </div>
            </form>
          )}
        </div>

        {error && (
          <p role="alert" className="border-2 border-alert bg-alert/10 px-4 py-3 text-sm font-semibold text-[#ff8a8b]">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
