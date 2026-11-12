/**
 * Texto estilo tablero de persianas (split-flap): cada letra gira en X una vez.
 * Solo transform/opacity; con "reducir movimiento" aparece directo.
 */
export default function FlapText({ text, delay = 0, step = 22, className = '' }) {
  return (
    <span className={`flap-wrap ${className}`}>
      <span className="sr-only">{text}</span>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden className="flap" style={{ animationDelay: `${delay + i * step}ms` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
