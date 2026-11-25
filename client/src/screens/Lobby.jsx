import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, LoaderCircle, Pencil, Share2, SlidersHorizontal, TrainFront, UserRound, X } from 'lucide-react';
import { MAX_NAME, MAX_PLAYERS, QUESTIONS_PER_GAME } from '@linean/shared';
import GameHeader, { ConnectionPill } from '../components/GameHeader';
import LineBadge from '../components/LineBadge';
import { GameAdInline } from '../components/AdSlot';
import FlapText from '../components/landing/FlapText';
import { lineColorFor } from '../lib/lines';
import { copyText, shareOrCopy } from '../lib/share';
import { useShareOrigin } from '../lib/useShareOrigin';

export default function Lobby({ room, meId, onStart, onCategories, onLeave, onRename, connected }) {
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const isHost = room.hostId === meId;
  const { origin, rewritten } = useShareOrigin();
  const link = `${origin}${location.pathname}?sala=${room.code}`;
  const host = room.players.find((p) => p.id === room.hostId);
  const noCategories = room.categories?.length > 0 && !room.categories.some((c) => c.on);

  const flash = (text) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 2200);
  };

  async function share() {
    const result = await shareOrCopy({ title: 'Línea N', text: `Subite a mi sala de Línea N: ${room.code}`, url: link });
    if (result === 'copied') flash('Link copiado');
    else if (result === 'failed') flash('No se pudo copiar: pasá el link de abajo');
  }

  async function copyCode() {
    flash((await copyText(room.code)) ? 'Código copiado' : 'No se pudo copiar el código');
  }

  async function start() {
    setError(null);
    setStarting(true);
    const res = await onStart();
    setStarting(false);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      <GameHeader onExit={onLeave} variant="back" exitLabel="Salir de la sala" right={<ConnectionPill connected={connected} />}>
        <p className="label-caps">Andén de espera</p>
      </GameHeader>

      <section aria-labelledby="code-title" className="slab animate-slide-up bg-sign shadow-[8px_8px_0_0_#000]">
        <div className="flex items-center justify-between border-b-2 border-rail px-5 py-3">
          <h1 id="code-title" className="label-caps">
            Código de sala
          </h1>
          <span className="font-mono text-xs text-mute">
            {room.players.length}/{MAX_PLAYERS} a bordo
          </span>
        </div>

        <div className="px-5 pt-5">
          <p className="flex justify-center gap-2 sm:gap-3" aria-label={`Código ${room.code.split('').join(' ')}`}>
            {room.code.split('').map((ch, i) => (
              <span key={i} className="flap-wrap" aria-hidden>
                <span
                  className="flap grid h-20 w-16 place-items-center border-2 border-signal bg-tunnel font-mono text-5xl font-bold text-signal sm:h-24 sm:w-20 sm:text-6xl"
                  style={{ animationDelay: `${150 + i * 90}ms` }}
                >
                  {ch}
                </span>
              </span>
            ))}
          </p>
          <p className="mt-4 text-center text-sm text-mute">
            {rewritten ? 'Desde el celu (misma Wi-Fi) abrí este link:' : 'Abrí el link en otro dispositivo o ingresá el código en “Unirse”.'}
          </p>
          <p className="mt-2 text-center font-mono text-xs break-all text-chalk/80 select-all">{link}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <button type="button" onClick={share} className="press flex min-h-12 cursor-pointer items-center justify-center gap-2 bg-signal px-3 text-sm font-bold text-tunnel uppercase" style={{ '--press-shadow': '#f4f2ea' }}>
            <Share2 className="size-5" aria-hidden /> Compartir
          </button>
          <button type="button" onClick={copyCode} className="press flex min-h-12 cursor-pointer items-center justify-center gap-2 border-2 border-chalk bg-platform-2 px-3 text-sm font-bold uppercase">
            <Copy className="size-5" aria-hidden /> Copiar código
          </button>
        </div>
        <p role="status" className={`-mt-2 px-5 pb-4 text-center text-sm font-semibold text-signal transition-opacity ${feedback ? 'opacity-100' : 'opacity-0'}`}>
          {feedback ?? ' '}
        </p>
      </section>

      <section aria-labelledby="riders-title" className="slab animate-slide-up overflow-hidden" style={{ animationDelay: '120ms' }}>
        <h2 id="riders-title" className="label-caps !text-signal border-b-2 border-rail bg-sign px-5 py-3">
          Pasajeros a bordo
        </h2>
        <ul className="divide-y-2 divide-rail">
          {room.players.map((p, i) => (
            <li key={p.id} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 ${p.connected ? '' : 'opacity-50'}`}>
              <LineBadge line={p.name.charAt(0).toUpperCase() || '?'} color={p.color} size="sm" />
              <span className="min-w-0">
                {p.id === meId && onRename ? (
                  <NameEditor name={p.name} delay={i * 60} onRename={onRename} />
                ) : (
                  <FlapText text={p.name} delay={i * 60} className="block truncate text-lg font-bold" />
                )}
                {!p.connected && <span className="block text-sm text-mute">Reconectando…</span>}
              </span>
              <span className="flex items-center gap-2">
                {p.id === meId && (
                  <span className="flex items-center gap-1 border-2 border-signal px-2 py-0.5 text-xs font-bold text-signal uppercase">
                    <UserRound className="size-3.5" aria-hidden /> Vos
                  </span>
                )}
                {p.id === room.hostId && (
                  <span className="flex items-center gap-1 border-2 border-rail px-2 py-0.5 text-xs font-bold uppercase">
                    <TrainFront className="size-3.5" aria-hidden /> Conductor
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {room.categories?.length > 0 && (
        <CategoryPicker categories={room.categories} isHost={isHost} hostName={host?.name} onChange={onCategories} />
      )}

      <div className="mt-auto grid gap-3 pb-2">
        {error && (
          <p role="alert" className="border-2 border-alert bg-alert/10 px-4 py-3 text-sm font-semibold text-[#ff8a8b]">
            {error}
          </p>
        )}
        {isHost ? (
          <>
            <button
              type="button"
              onClick={start}
              disabled={starting || !connected || noCategories}
              className="press flex min-h-16 cursor-pointer items-center justify-center gap-3 bg-signal text-xl font-bold text-tunnel uppercase disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              style={{ '--press-shadow': '#f4f2ea' }}
            >
              <TrainFront className="size-6" aria-hidden />
              Arrancar el tren
            </button>
            {room.players.length < 2 && <p className="text-center text-sm text-mute">Estás solo en el andén: podés arrancar igual para probar.</p>}
          </>
        ) : (
          <p className="slab flex min-h-16 items-center justify-center gap-3 px-4 text-center font-semibold">
            <span className="live-dot size-2.5 rounded-full bg-line-d" aria-hidden />
            Esperando que {host?.name ?? 'el conductor'} arranque el tren…
          </p>
        )}
      </div>
      <GameAdInline />
    </>
  );
}

/**
 * Qué categorías entran en la partida. El conductor las prende y apaga (con atajos para
 * prender o apagar todas); el resto ve cuáles quedaron.
 */
function CategoryPicker({ categories, isHost, hostName, onChange }) {
  // Copia local para que los toques se vean al instante; se resincroniza con lo que manda el server.
  const serverOff = categories
    .filter((c) => !c.on)
    .map((c) => c.name)
    .join('\n');
  const [off, setOff] = useState(() => new Set(serverOff ? serverOff.split('\n') : []));
  useEffect(() => setOff(new Set(serverOff ? serverOff.split('\n') : [])), [serverOff]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  const onCount = categories.length - off.size;
  const questions = categories.reduce((n, c) => n + (off.has(c.name) ? 0 : c.questions), 0);

  async function apply(next) {
    setOff(next);
    setError(null);
    const res = await onChange?.([...next]);
    if (res?.error) setError(res.error);
  }
  const toggle = (name) => {
    const next = new Set(off);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    apply(next);
  };

  const summary =
    onCount === categories.length ? 'Todas las categorías' : onCount === 0 ? 'Ninguna categoría' : `${onCount} de ${categories.length} categorías`;
  const chip = (on) => `flex min-h-12 items-center gap-2 border-2 px-3 text-sm font-bold ${on ? 'border-chalk bg-platform-2 text-chalk' : 'border-rail bg-tunnel text-mute'}`;
  const shortcut =
    'press flex min-h-12 cursor-pointer items-center justify-center gap-2 border-2 border-chalk bg-platform-2 px-3 text-sm font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none';

  return (
    <section aria-labelledby="cats-title" className="slab animate-slide-up overflow-hidden" style={{ animationDelay: '180ms' }}>
      <h2 id="cats-title">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="cats-panel"
          className="focus-ring flex min-h-14 w-full cursor-pointer items-center gap-3 bg-sign px-5 py-3 text-left"
        >
          <SlidersHorizontal className="size-5 shrink-0 text-signal" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="label-caps block !text-signal">Categorías</span>
            <span className="block truncate text-sm font-semibold">
              {summary} · <span className="font-mono">{questions}</span> preguntas
            </span>
          </span>
          <span className="shrink-0 text-sm font-bold text-mute uppercase">{isHost ? 'Elegir' : 'Ver'}</span>
          <ChevronDown className={`size-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </h2>

      {open && (
        <div id="cats-panel" className="grid gap-4 border-t-2 border-rail p-5">
          {isHost ? (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => apply(new Set())} disabled={off.size === 0} className={shortcut}>
                <Check className="size-4" aria-hidden /> Todas
              </button>
              <button type="button" onClick={() => apply(new Set(categories.map((c) => c.name)))} disabled={onCount === 0} className={shortcut}>
                <X className="size-4" aria-hidden /> Ninguna
              </button>
            </div>
          ) : (
            <p className="text-sm text-mute">Las elige {hostName ?? 'el conductor'}.</p>
          )}

          <ul className="flex flex-wrap gap-2" aria-label="Categorías de la partida">
            {categories.map((c) => {
              const on = !off.has(c.name);
              const color = lineColorFor(c.name);
              const body = (
                <>
                  <span className="grid size-5 shrink-0 place-items-center border-2" style={{ borderColor: color, background: on ? color : 'transparent' }} aria-hidden>
                    {on && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span>{c.name}</span>
                  <span className="font-mono text-xs text-mute">{c.questions}</span>
                </>
              );
              return (
                <li key={c.name}>
                  {isHost ? (
                    <button type="button" onClick={() => toggle(c.name)} aria-pressed={on} className={`focus-ring cursor-pointer transition-colors ${chip(on)}`}>
                      {body}
                    </button>
                  ) : (
                    <span className={chip(on)}>
                      <span className="sr-only">{on ? 'Activa:' : 'Apagada:'}</span>
                      {body}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {onCount === 0 ? (
            <p role="status" className="text-sm font-semibold text-signal">
              Prendé al menos una categoría para arrancar.
            </p>
          ) : (
            questions < QUESTIONS_PER_GAME && (
              <p role="status" className="text-sm text-mute">
                Con estas categorías hay {questions} {questions === 1 ? 'pregunta' : 'preguntas'}: la partida va a ser más corta.
              </p>
            )
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-[#ff8a8b]">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Tu nombre en la lista, con un lápiz para cambiarlo antes de arrancar. */
function NameEditor({ name, delay, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const open = () => {
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  async function save(e) {
    e.preventDefault();
    const next = draft.replace(/\s+/g, ' ').trim();
    if (!next) return setError('Escribí un nombre');
    if (next === name) return setEditing(false);
    setSaving(true);
    const res = await onRename(next);
    setSaving(false);
    if (res?.ok) setEditing(false);
    else setError(res?.error ?? 'No se pudo cambiar el nombre');
  }

  if (!editing) {
    return (
      <span className="flex min-w-0 items-center gap-1">
        <FlapText text={name} delay={delay} className="block min-w-0 truncate text-lg font-bold" />
        <button
          type="button"
          onClick={open}
          aria-label="Cambiar mi nombre"
          title="Cambiar mi nombre"
          className="focus-ring grid size-12 shrink-0 cursor-pointer place-items-center text-mute transition-colors hover:text-signal"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <form onSubmit={save} onKeyDown={(e) => e.key === 'Escape' && setEditing(false)} className="grid gap-1">
      <span className="flex items-center gap-2">
        <label htmlFor="rename-input" className="sr-only">
          Tu nombre
        </label>
        <input
          id="rename-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_NAME))}
          autoFocus
          autoComplete="nickname"
          enterKeyHint="done"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'rename-error' : undefined}
          className="focus-ring min-h-12 w-full min-w-0 border-2 border-signal bg-tunnel px-3 text-lg font-bold outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          aria-label="Guardar nombre"
          className="press grid size-12 shrink-0 cursor-pointer place-items-center bg-signal text-tunnel disabled:opacity-50"
          style={{ '--press-shadow': '#f4f2ea' }}
        >
          {saving ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Check className="size-5" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Cancelar"
          className="grid size-12 shrink-0 cursor-pointer place-items-center border-2 border-rail text-chalk"
        >
          <X className="size-5" aria-hidden />
        </button>
      </span>
      {error && (
        <span id="rename-error" role="alert" className="text-sm font-semibold text-[#ff8a8b]">
          {error}
        </span>
      )}
    </form>
  );
}
