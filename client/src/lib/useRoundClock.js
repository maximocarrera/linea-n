import { useEffect, useRef, useState } from 'react';

/**
 * Reloj de una ronda. Fases: 'intro' (pasa el tren) → 'live' → 'over'.
 * La barra visual se anima con CSS; este hook solo maneja números y el fin.
 */
export function useRoundClock(startsAt, endsAt, onExpire) {
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    let fired = false;
    let id = null;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (!fired && t >= endsAt) {
        fired = true;
        clearInterval(id);
        onExpireRef.current?.();
      }
    };
    id = setInterval(tick, 200);
    tick();
    return () => clearInterval(id);
  }, [startsAt, endsAt]);

  const phase = now < startsAt ? 'intro' : now < endsAt ? 'live' : 'over';
  const secondsLeft = Math.max(0, Math.ceil((endsAt - Math.max(now, startsAt)) / 1000));
  return { phase, secondsLeft };
}
