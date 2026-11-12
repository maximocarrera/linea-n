import { useState } from 'react';
import { BOARD_COLORS } from '../lib/lines';

const COLORS = ['#ffd400', ...BOARD_COLORS, '#f4f2ea'];

/**
 * Lluvia de "boletos" para celebrar. Decorativa (aria-hidden), solo transform,
 * una sola pasada. Con "reducir movimiento" no se ve (la animación dura 1 ms).
 */
export default function Confetti({ count = 36 }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      width: 6 + Math.random() * 6,
      height: 10 + Math.random() * 10,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 900,
      duration: 2200 + Math.random() * 1600,
      drift: (Math.random() - 0.5) * 160,
      spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
    })),
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
