import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, RotateCcw, TrainFront } from 'lucide-react';
import { INTRO_MS, ROUND_SECONDS, SOLO_REVEAL_MS, SOLO_TARGET, TERMINAL_STATION, highlightAnswers, matchAnswer } from '@linean/shared';
import GameHeader from '../components/GameHeader';
import LineProgress from '../components/LineProgress';
import QuestionView from '../components/QuestionView';
import RevealPanel from '../components/RevealPanel';
import { fetchSoloGame } from '../lib/api';
import { getRecent, rememberPlayed } from '../lib/recent';
import { SoloResults } from './Results';

const makeClock = () => {
  const startsAt = Date.now() + INTRO_MS;
  return { startsAt, endsAt: startsAt + ROUND_SECONDS * 1000 };
};

/** Modo solo: pide las 10 preguntas al server y después puntúa localmente con shared/scoring. */
export default function SoloGame({ onExit, onRetry }) {
  const [load, setLoad] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchSoloGame(getRecent(), { signal: ctrl.signal })
      .then(({ gameId, questions }) =>
        setLoad(questions.length ? { status: 'ready', gameId, questions } : { status: 'error', message: 'No hay preguntas cargadas todavía.' }),
      )
      .catch((err) => {
        if (!ctrl.signal.aborted) setLoad({ status: 'error', message: err.message });
      });
    return () => ctrl.abort();
  }, [attempt]);

  if (load.status === 'ready') return <SoloRun gameId={load.gameId} questions={load.questions} onExit={onExit} onRetry={onRetry} />;

  if (load.status === 'loading') return <WaitingTrain />;

  return (
    <div className="m-auto grid w-full max-w-sm gap-4">
      <div className="slab border-l-[6px] border-l-alert p-5" role="alert">
        <p className="label-caps">Servicio interrumpido</p>
        <p className="mt-1 text-lg font-semibold">{load.message}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          setLoad({ status: 'loading' });
          setAttempt((n) => n + 1);
        }}
        className="press flex min-h-14 cursor-pointer items-center justify-center gap-2 bg-signal font-bold text-tunnel uppercase"
        style={{ '--press-shadow': '#f4f2ea' }}
      >
        <RotateCcw className="size-5" aria-hidden /> Reintentar
      </button>
      <button type="button" onClick={onExit} className="press flex min-h-14 cursor-pointer items-center justify-center gap-2 border-2 border-chalk bg-platform-2 font-bold uppercase">
        Volver al hall
      </button>
    </div>
  );
}

/** Pantalla de espera reutilizable (carga de preguntas / entre estados). */
export function WaitingTrain({ text = 'Esperando el tren…' }) {
  return (
    <div className="m-auto grid place-items-center gap-4 text-center" role="status">
      <TrainFront className="size-10 animate-pulse text-signal" aria-hidden />
      <p className="label-caps">{text}</p>
    </div>
  );
}

function SoloRun({ gameId, questions, onExit, onRetry }) {
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState([]); // puntos por estación
  const [plays, setPlays] = useState([]); // { id, text } de cada respuesta válida (el server la vuelve a validar)
  const [result, setResult] = useState(undefined); // undefined = jugando · null = sin respuesta · {display, points}
  const [clock, setClock] = useState(makeClock);

  const question = questions[index];
  const score = marks.reduce((a, b) => a + b, 0);
  const done = index >= questions.length;
  const highlights = useMemo(() => (question ? highlightAnswers(question) : []), [question]);

  // Se registra como "jugada" recién cuando aparece en pantalla.
  useEffect(() => {
    if (question) rememberPlayed(question.id);
  }, [question]);

  const submit = useCallback(
    async (text) => {
      if (result !== undefined) return { ok: false, reason: 'locked' };
      const match = matchAnswer(question, text);
      if (!match) return { ok: false, reason: 'invalid' };
      setResult(match);
      setMarks((m) => [...m, match.points]);
      setPlays((p) => [...p, { id: question.id, text }]);
      return { ok: true, ...match };
    },
    [question, result],
  );

  const expire = useCallback(() => {
    if (result !== undefined) return;
    setResult(null);
    setMarks((m) => [...m, 0]);
  }, [result]);

  const next = useCallback(() => {
    setIndex((i) => i + 1);
    setResult(undefined);
    setClock(makeClock());
  }, []);

  // Avance automático después de mostrar el resultado
  useEffect(() => {
    if (result === undefined || done) return;
    const t = setTimeout(next, SOLO_REVEAL_MS);
    return () => clearTimeout(t);
  }, [result, done, next]);

  if (done) return <SoloResults score={score} target={SOLO_TARGET} marks={marks} gameId={gameId} plays={plays} onRetry={onRetry} onExit={onExit} />;

  return (
    <>
      <TopBar score={score} onExit={onExit} />
      <LineProgress total={questions.length} current={index} marks={marks} />

      {result === undefined ? (
        <QuestionView
          key={index}
          question={{ ...question, validCount: question.answers.length }}
          index={index}
          total={questions.length}
          startsAt={clock.startsAt}
          endsAt={clock.endsAt}
          onSubmit={submit}
          onExpire={expire}
        />
      ) : (
        <>
          <RevealPanel key={`r${index}`} prompt={question.prompt} mine={result} highlights={highlights} />
          <button
            type="button"
            onClick={next}
            className="press mt-auto flex min-h-16 cursor-pointer items-center justify-center gap-3 bg-signal text-lg font-bold text-tunnel uppercase"
            style={{ '--press-shadow': '#f4f2ea' }}
          >
            {index + 1 < questions.length ? 'Siguiente estación' : `Llegar a ${TERMINAL_STATION}`}
            <ArrowRight className="size-6" aria-hidden />
          </button>
        </>
      )}
    </>
  );
}

function TopBar({ score, onExit }) {
  const pct = Math.min(1, score / SOLO_TARGET);
  return (
    <GameHeader onExit={onExit} exitLabel="Salir del viaje" confirmText="¿Bajarte del tren? Vas a perder este viaje.">
      <div className="flex items-center gap-3">
        <div className="relative h-3 flex-1 overflow-hidden bg-white/10" role="progressbar" aria-label="Puntos hacia la meta" aria-valuemin={0} aria-valuemax={SOLO_TARGET} aria-valuenow={Math.min(score, SOLO_TARGET)}>
          <div className={`absolute inset-0 origin-left transition-transform duration-700 ease-train ${pct >= 1 ? 'bg-signal' : 'bg-line-a'}`} style={{ transform: `scaleX(${pct})` }} />
        </div>
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
          {score}
          <span className="text-mute">/{SOLO_TARGET}</span>
        </span>
      </div>
    </GameHeader>
  );
}
