import { Crown, DoorOpen, Home, RotateCcw, TrainFront } from 'lucide-react';
import { TERMINAL_STATION } from '@linean/shared';
import Confetti from '../components/Confetti';
import LineBadge from '../components/LineBadge';
import LineProgress from '../components/LineProgress';
import CountUp from '../components/landing/CountUp';
import { GameAdInline } from '../components/AdSlot';
import FlapText from '../components/landing/FlapText';
import { rankPlayers } from '../lib/ranking';

// ─────────────────────────────── Solo ───────────────────────────────

export function SoloResults({ score, target, marks, onRetry, onExit }) {
  const won = score >= target;
  const pct = Math.min(1, score / target);

  return (
    <>
      {won && <Confetti />}
      <p className="label-caps animate-fade-in pt-2">Fin del recorrido</p>

      <h1 className="text-[clamp(2.5rem,12vw,4.5rem)] leading-[0.9] font-bold tracking-[-0.04em] uppercase">
        {won ? (
          <>
            <span className="block animate-slide-up">Llegaste a</span>
            <span className="mt-2 inline-block animate-slide-up" style={{ animationDelay: '90ms' }}>
              <span className="inline-block -rotate-2 bg-signal px-3 pb-1 text-tunnel shadow-[6px_6px_0_0_#000]">{TERMINAL_STATION}.</span>
            </span>
          </>
        ) : (
          <>
            <span className="block animate-slide-up">Te quedaste</span>
            <span className="block animate-slide-up text-mute" style={{ animationDelay: '90ms' }}>
              en el andén.
            </span>
          </>
        )}
      </h1>

      <section className="slab animate-slide-up p-5" style={{ animationDelay: '180ms' }} aria-label="Puntaje final">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-caps">Puntaje final</p>
            <p className={`font-mono text-6xl font-bold ${won ? 'text-signal' : ''}`}>
              <CountUp value={score} duration={1200} />
            </p>
          </div>
          <p className="pb-2 text-right text-sm text-mute">
            {won ? `+${score - target} sobre la meta` : `Te faltaron ${target - score} pts`}
            <br />
            <span className="font-mono">Meta {target}</span>
          </p>
        </div>
        <div className="relative mt-4 h-3 bg-white/10" aria-hidden>
          <div className="absolute inset-0 origin-left bg-signal" style={{ transform: `scaleX(${pct})`, animation: 'grow-x 1200ms cubic-bezier(.2,.8,.2,1) 200ms both' }} />
        </div>
      </section>

      <section className="animate-slide-up" style={{ animationDelay: '260ms' }} aria-label="Recorrido">
        <p className="label-caps mb-2">Tu recorrido</p>
        <LineProgress total={marks.length} current={marks.length} marks={marks} />
      </section>

      <div className="mt-auto grid gap-3 pb-2">
        <button type="button" onClick={onRetry} className="press flex min-h-16 cursor-pointer items-center justify-center gap-3 bg-signal text-xl font-bold text-tunnel uppercase" style={{ '--press-shadow': '#f4f2ea' }}>
          <RotateCcw className="size-6" aria-hidden /> Otro viaje
        </button>
        <button type="button" onClick={onExit} className="press flex min-h-14 cursor-pointer items-center justify-center gap-2 border-2 border-chalk bg-platform-2 font-bold uppercase">
          <Home className="size-5" aria-hidden /> Volver al hall
        </button>
      </div>
      <GameAdInline />
    </>
  );
}

// ─────────────────────────────── Multijugador ───────────────────────────────

export function MultiResults({ ranking, meId, isHost, onRestart, onLeave }) {
  const ranked = rankPlayers(ranking);
  const top = ranked[0];
  const winners = ranked.filter((p) => p.position === 1);
  const tie = winners.length > 1;
  const me = ranked.find((p) => p.id === meId);
  const iWon = me?.position === 1;

  return (
    <>
      <Confetti count={iWon ? 48 : 28} />

      <header className="grid gap-2 pt-2">
        <p className="label-caps animate-fade-in">Cabecera · {TERMINAL_STATION}</p>
        <h1 className="text-[clamp(2.25rem,11vw,4rem)] leading-[0.9] font-bold tracking-[-0.04em] uppercase">
          <span className="block animate-slide-up">{tie ? 'Empate en' : 'Llegó a'}</span>
          <span className="mt-2 inline-block animate-slide-up" style={{ animationDelay: '90ms' }}>
            <span className="inline-block -rotate-2 bg-signal px-3 pb-1 text-tunnel shadow-[6px_6px_0_0_#000]">{TERMINAL_STATION}</span>
          </span>
        </h1>
        {top && (
          <p className="mt-2 animate-fade-in text-lg text-mute" style={{ animationDelay: '200ms' }}>
            {tie ? (
              <>
                {winners.map((w) => w.name).join(' y ')} empataron con <strong className="text-chalk">{top.score} pts</strong>.
              </>
            ) : (
              <>
                <strong className="text-chalk">{top.name}</strong> hizo el recorrido más largo: <strong className="text-signal">{top.score} pts</strong>.
              </>
            )}
            {me && !iWon && ` Vos terminaste ${me.position}.º.`}
          </p>
        )}
      </header>

      <Podium ranked={ranked} meId={meId} />

      <RankingLine ranked={ranked} meId={meId} />

      <div className="mt-auto grid gap-3 pb-2">
        {isHost ? (
          <button type="button" onClick={onRestart} className="press flex min-h-16 cursor-pointer items-center justify-center gap-3 bg-signal text-xl font-bold text-tunnel uppercase" style={{ '--press-shadow': '#f4f2ea' }}>
            <TrainFront className="size-6" aria-hidden /> Otra vuelta
          </button>
        ) : (
          <p className="slab flex min-h-14 items-center justify-center gap-3 px-4 text-center font-semibold">
            <span className="live-dot size-2.5 rounded-full bg-line-d" aria-hidden />
            El conductor puede arrancar otra vuelta
          </p>
        )}
        <button type="button" onClick={onLeave} className="press flex min-h-14 cursor-pointer items-center justify-center gap-2 border-2 border-chalk bg-platform-2 font-bold uppercase">
          <DoorOpen className="size-5" aria-hidden /> Bajarse
        </button>
      </div>
      <GameAdInline />
    </>
  );
}

const PODIUM = {
  1: { height: 'h-40', delay: 900, accent: '#ffd400', label: '1.º' },
  2: { height: 'h-28', delay: 450, accent: '#c9ced8', label: '2.º' },
  3: { height: 'h-20', delay: 150, accent: '#d08a4f', label: '3.º' },
};

/** Podio 2–1–3. Los bloques suben desde el piso (translateY en un contenedor recortado). */
function Podium({ ranked, meId }) {
  const top3 = ranked.slice(0, 3);
  // Orden visual: 2.º, 1.º, 3.º (con 1 o 2 jugadores se ajusta solo)
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  // Altura según la posición (con empate, los empatados quedan a la misma altura);
  // el orden de aparición (delay) sigue el lugar en el podio.
  const slotOf = (p) => top3.indexOf(p) + 1;

  return (
    <section
      aria-label="Podio"
      className={`mx-auto grid w-full items-end gap-2 sm:gap-3 ${order.length === 1 ? 'max-w-[11rem]' : order.length === 2 ? 'max-w-[22rem]' : ''}`}
      style={{ gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))` }}
    >
      {order.map((p) => {
        const slot = slotOf(p);
        const cfg = { ...PODIUM[Math.min(p.position, 3)], delay: PODIUM[slot].delay };
        const first = p.position === 1;
        return (
          <div key={p.id} className="flex min-w-0 flex-col items-center">
            <div className="flex min-w-0 animate-pop-in flex-col items-center gap-1 pb-2" style={{ animationDelay: `${cfg.delay + 350}ms` }}>
              {first && <Crown className="crown-drop size-8 text-signal" style={{ animationDelay: `${cfg.delay + 450}ms` }} aria-hidden />}
              <LineBadge line={p.name.charAt(0).toUpperCase() || '?'} color={p.color} size={first ? 'lg' : 'md'} />
              <span className={`max-w-full truncate text-center font-bold ${first ? 'text-lg' : 'text-sm'} ${p.id === meId ? 'text-signal' : ''}`}>
                {p.name}
                {p.id === meId && <span className="sr-only"> (vos)</span>}
              </span>
              <span className="font-mono text-sm font-bold">
                <CountUp value={p.score} duration={1000} /> pts
              </span>
            </div>
            <div className={`w-full overflow-hidden ${cfg.height}`}>
              <div className="rise flex h-full flex-col items-center justify-start border-2 border-b-0 bg-platform pt-3" style={{ borderColor: cfg.accent, animationDelay: `${cfg.delay}ms` }}>
                <span className="font-mono text-3xl font-bold" style={{ color: cfg.accent }}>
                  {p.position}
                </span>
                <span className="label-caps !text-[0.6875rem]">{p.position === 1 ? 'Cabecera' : `Estación ${p.position}`}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="col-span-full h-2 bg-signal" aria-hidden />
    </section>
  );
}

/**
 * Ranking completo como mapa de línea vertical: arriba la cabecera (ganador),
 * abajo el resto en orden. La barra muestra qué tan lejos llegó cada uno respecto del ganador.
 */
function RankingLine({ ranked, meId }) {
  const best = Math.max(1, ranked[0]?.score ?? 1);
  return (
    <section aria-labelledby="ranking-title" className="slab overflow-hidden">
      <h2 id="ranking-title" className="label-caps !text-signal border-b-2 border-rail bg-sign px-5 py-3">
        Ranking final · {ranked.length} {ranked.length === 1 ? 'pasajero' : 'pasajeros'}
      </h2>
      <ol className="relative py-2">
        {/* vía vertical */}
        <span className="absolute top-6 bottom-6 left-[2.125rem] w-1 bg-rail" aria-hidden />
        {ranked.map((p, i) => (
          <li
            key={p.id}
            className={`relative grid animate-slide-up grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 ${p.id === meId ? 'bg-signal/10' : ''}`}
            style={{ animationDelay: `${1300 + i * 70}ms` }}
          >
            <span className="relative z-10 grid place-items-center">
              <span
                className={`grid size-9 place-items-center border-[3px] bg-tunnel font-mono text-sm font-bold ${p.position === 1 ? 'rotate-45' : 'rounded-full'}`}
                style={{ borderColor: p.position === 1 ? '#ffd400' : p.color }}
              >
                <span className={p.position === 1 ? '-rotate-45' : ''}>{p.position}</span>
              </span>
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <FlapText text={p.name} delay={1300 + i * 70} className={`truncate font-bold ${p.id === meId ? 'text-signal' : ''}`} />
                {p.id === meId && <span className="shrink-0 border-2 border-signal px-1.5 text-xs font-bold text-signal uppercase">Vos</span>}
                {!p.connected && <span className="shrink-0 text-xs text-mute">(se bajó)</span>}
              </span>
              <span className="relative mt-1.5 block h-1.5 bg-white/10" aria-hidden>
                <span
                  className="absolute inset-0 origin-left"
                  style={{ backgroundColor: p.color, transform: `scaleX(${p.score / best})`, animation: `grow-x 800ms cubic-bezier(.2,.8,.2,1) ${1400 + i * 70}ms both` }}
                />
              </span>
            </span>
            <span className="text-right font-mono text-lg font-bold tabular-nums">
              {p.score}
              <span className="text-sm text-mute"> pts</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
