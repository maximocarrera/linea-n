import { useState } from 'react';
import { ROUND_SECONDS, tierFor } from '@linean/shared';
import { lineColorFor } from '../lib/lines';
import { useRoundClock } from '../lib/useRoundClock';
import AnswerInput from './AnswerInput';
import CountdownBar from './CountdownBar';
import LineBadge from './LineBadge';
import TierChip from './TierChip';
import TrainTransition from './TrainTransition';

/**
 * Una estación = una pregunta. Usado por solo y multijugador.
 * `locked`: la respuesta válida ya registrada (o null).
 */
export default function QuestionView({ question, index, total, startsAt, endsAt, onSubmit, onExpire, locked, children }) {
  const { phase, secondsLeft } = useRoundClock(startsAt, endsAt, onExpire);
  // Se congela al montar (el componente se monta con `key` por ronda).
  const [introMs] = useState(() => Math.max(0, startsAt - Date.now()));
  const color = lineColorFor(question.category);

  return (
    <>
      {phase === 'intro' && (
        <TrainTransition
          durationMs={introMs || 1}
          title={`Estación ${index + 1}`}
          subtitle={index + 1 === total ? 'Última parada antes de la cabecera' : `${question.category} · ${index + 1} de ${total}`}
        />
      )}

      {phase !== 'intro' && (
        <section className="flex flex-1 animate-slide-up flex-col gap-5" aria-labelledby="question-prompt">
          <div className="flex items-center gap-3">
            <LineBadge line={question.category.charAt(0).toUpperCase()} color={color} size="sm" />
            <span className="label-caps truncate">{question.category}</span>
            <span className="ml-auto shrink-0 font-mono text-sm text-mute">
              Estación {index + 1}/{total}
            </span>
          </div>

          <div className="border-l-[6px] pl-4" style={{ borderColor: color }}>
            <h1 id="question-prompt" className="text-[clamp(1.75rem,7vw,2.5rem)] leading-[1.08] font-bold tracking-tight text-balance">
              {question.prompt}
            </h1>
            <p className="mt-2 text-sm text-mute">
              {question.validCount} respuestas válidas · cuanto más rara, más suma
            </p>
          </div>

          <CountdownBar key={endsAt} endsAt={endsAt} totalMs={ROUND_SECONDS * 1000} secondsLeft={secondsLeft} />

          {locked ? <LockedAnswer answer={locked} /> : <AnswerInput onSubmit={onSubmit} disabled={phase !== 'live'} />}

          {children}
        </section>
      )}
    </>
  );
}

function LockedAnswer({ answer }) {
  const tier = tierFor(answer.points);
  return (
    <div className="slab relative animate-pop-in border-l-[6px] p-5" style={{ borderLeftColor: tier?.color }} role="status">
      <span className="pointer-events-none absolute top-3 right-5 animate-float-up font-mono text-4xl font-bold text-signal" aria-hidden>
        +{answer.points}
      </span>
      <p className="label-caps">Respuesta registrada</p>
      <p className="mt-1 text-3xl font-bold tracking-tight uppercase">{answer.display}</p>
      <TierChip points={answer.points} className="mt-3 inline-block" />
    </div>
  );
}
