import { useCallback, useEffect, useState } from 'react';
import { ConnectionPill } from '../components/GameHeader';
import GameHeader from '../components/GameHeader';
import LineProgress from '../components/LineProgress';
import QuestionView from '../components/QuestionView';
import RevealPanel from '../components/RevealPanel';
import Scoreboard from '../components/Scoreboard';

const LEAVE_CONFIRM = '¿Bajarte del tren? La partida sigue sin vos.';

export default function MultiGame({ room, round, reveal, meId, onSubmit, onLeave, connected }) {
  const showReveal = reveal && reveal.index === round.index;
  const myResult = showReveal ? reveal.results.find((r) => r.id === meId) : null;
  const me = room.players.find((p) => p.id === meId);
  const active = room.players.filter((p) => p.connected).length;

  return (
    <>
      <GameHeader onExit={onLeave} exitLabel="Salir de la partida" confirmText={LEAVE_CONFIRM} right={connected ? <ScorePill score={me?.score ?? 0} /> : <ConnectionPill connected={false} />}>
        <p className="font-mono text-sm text-mute">Sala {room.code}</p>
      </GameHeader>

      <LineProgress total={round.total} current={round.index} />

      {showReveal ? (
        <>
          <RevealPanel
            prompt={round.question.prompt}
            mine={myResult?.answer ? { display: myResult.answer, points: myResult.points } : null}
            highlights={reveal.highlights}
            results={reveal.results}
            meId={meId}
          />
          <NextIn key={reveal.nextAt} at={reveal.nextAt} totalMs={reveal.nextInMs} last={round.index + 1 >= round.total} />
        </>
      ) : (
        <Round key={round.index} round={round} onSubmit={onSubmit}>
          <div className="mt-auto pt-2">
            <p className="label-caps mb-3">
              Respondieron {round.answered.length}/{active}
            </p>
            <Scoreboard players={room.players} meId={meId} answeredIds={round.answered} />
          </div>
        </Round>
      )}
    </>
  );
}

function ScorePill({ score }) {
  return (
    <span className="shrink-0 border-2 border-rail px-3 py-1.5 font-mono text-sm font-bold">
      <span className="sr-only">Tu puntaje: </span>
      {score} <span className="text-mute">pts</span>
    </span>
  );
}

/** Ronda en curso: el estado local (mi respuesta) se resetea solo gracias a `key`. */
function Round({ round, onSubmit, children }) {
  const [mine, setMine] = useState(round.mine);

  const submit = useCallback(
    async (text) => {
      const res = await onSubmit(text);
      if (res?.ok) setMine({ display: res.display, points: res.points });
      return res;
    },
    [onSubmit],
  );

  return (
    <QuestionView question={round.question} index={round.index} total={round.total} startsAt={round.startsAt} endsAt={round.endsAt} onSubmit={submit} locked={mine}>
      {children}
    </QuestionView>
  );
}

/** Cuenta regresiva a la próxima estación: barra CSS + segundos. */
function NextIn({ at, totalMs, last }) {
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((at - Date.now()) / 1000)));
  const [anim] = useState(() => {
    const remaining = Math.max(0, at - Date.now());
    return { remaining, from: totalMs ? Math.min(1, remaining / totalMs) : 1 };
  });
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, Math.ceil((at - Date.now()) / 1000))), 250);
    return () => clearInterval(id);
  }, [at]);

  return (
    <div className="mt-auto pt-2">
      <p className="mb-2 flex items-baseline justify-between text-sm font-semibold">
        <span className="label-caps">{last ? 'Llegando a la cabecera' : 'Próxima estación'}</span>
        <span className="font-mono text-signal">{left}s</span>
      </p>
      <div className="relative h-2 overflow-hidden bg-white/10" aria-hidden>
        <div className="countdown-bar absolute inset-0 bg-line-d" style={{ '--from': anim.from, animationDuration: `${anim.remaining}ms` }} />
      </div>
    </div>
  );
}
