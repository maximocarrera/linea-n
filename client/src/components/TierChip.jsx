import { tierFor } from '@linean/shared';

/** Etiqueta de rareza: color + texto (nunca solo color). */
export default function TierChip({ points, className = '' }) {
  const tier = tierFor(points);
  if (!tier) return <span className={`border-2 border-rail px-2 py-0.5 text-xs font-bold whitespace-nowrap text-mute ${className}`}>Sin respuesta</span>;
  return (
    <span
      className={`border-2 px-2 py-0.5 text-xs font-bold whitespace-nowrap ${className}`}
      style={{ backgroundColor: `${tier.color}1f`, color: tier.color, borderColor: `${tier.color}88` }}
    >
      {tier.label} · {points}
    </span>
  );
}
