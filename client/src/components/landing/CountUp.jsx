import { useEffect, useState } from 'react';

/** Número que cuenta hasta `value` (ease-out; no es movimiento, corre también con "reducir movimiento"). El lector de pantalla lee solo el valor final. */
export default function CountUp({ value, duration = 900 }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <>
      <span className="sr-only">{value.toLocaleString('es-AR')}</span>
      <span aria-hidden className="tabular-nums">
        {shown.toLocaleString('es-AR')}
      </span>
    </>
  );
}
