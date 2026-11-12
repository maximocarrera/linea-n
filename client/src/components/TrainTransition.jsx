import StationSign from './StationSign';

const CARS = 3;
const WINDOWS = 5;

/**
 * Tren que cruza la pantalla entre preguntas.
 * 100% CSS (transform + opacity) → corre en el compositor a 60 FPS.
 */
export default function TrainTransition({ durationMs = 1400, title, subtitle }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-live="polite">
      <div className="absolute inset-0 bg-tunnel/85" style={{ animation: `curtain ${durationMs}ms ease-in-out both` }} />

      <div className="absolute inset-x-4 top-[18%] mx-auto max-w-md animate-pop-in">
        <StationSign line="N" title={title} subtitle={subtitle} size="md" />
      </div>

      <div className="train absolute top-1/2 left-0 flex h-32 w-[230vw] -translate-y-1/2 gap-2 sm:h-40" style={{ animationDuration: `${durationMs}ms` }} aria-hidden>
        {Array.from({ length: CARS }, (_, c) => (
          <div key={c} className={`train-car relative flex-1 overflow-hidden ${c === 0 ? 'rounded-l-[48px] rounded-r-lg' : 'rounded-lg'}`}>
            <div className="absolute inset-x-0 top-[62%] h-2.5 bg-signal" />
            <div className="absolute inset-x-6 top-[14%] flex h-[38%] gap-3">
              {Array.from({ length: WINDOWS }, (_, w) => (
                <div key={w} className="train-window flex-1 rounded-md" />
              ))}
            </div>
            {c === 0 && <div className="absolute top-[22%] left-3 size-3 rounded-full bg-signal shadow-[0_0_18px_6px_rgb(255_212_0/0.6)]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
