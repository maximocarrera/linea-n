import { useState } from 'react';
import { Check, Copy, Share2, TrainFront, UserRound } from 'lucide-react';
import { MAX_PLAYERS } from '@linean/shared';
import GameHeader, { ConnectionPill } from '../components/GameHeader';
import LineBadge from '../components/LineBadge';
import { GameAdInline } from '../components/AdSlot';
import FlapText from '../components/landing/FlapText';
import { copyText, shareOrCopy } from '../lib/share';
import { useShareOrigin } from '../lib/useShareOrigin';

export default function Lobby({ room, meId, onStart, onLeave, connected }) {
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const isHost = room.hostId === meId;
  const { origin, rewritten } = useShareOrigin();
  const link = `${origin}${location.pathname}?sala=${room.code}`;
  const host = room.players.find((p) => p.id === room.hostId);

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
                <FlapText text={p.name} delay={i * 60} className="block truncate text-lg font-bold" />
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
              disabled={starting || !connected}
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
