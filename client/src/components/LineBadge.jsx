const LINE_STYLES = {
  A: 'bg-line-a text-white',
  B: 'bg-line-b text-white',
  C: 'bg-line-c text-white',
  D: 'bg-line-d text-white',
  E: 'bg-line-e text-white',
  H: 'bg-line-h text-tunnel',
  N: 'bg-signal text-tunnel',
};

const SIZES = {
  sm: 'size-7 text-sm',
  md: 'size-10 text-lg',
  lg: 'size-14 text-2xl',
};

/** Círculo de línea de subte (A, B, C...). Con `color` se usa un color libre. */
export default function LineBadge({ line = 'N', size = 'md', color, className = '' }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-black leading-none shadow-[inset_0_-3px_0_rgb(0_0_0/0.2)] ${SIZES[size]} ${color ? 'text-white' : LINE_STYLES[line] ?? LINE_STYLES.N} ${className}`}
      style={color ? { backgroundColor: color } : undefined}
      aria-hidden
    >
      {line}
    </span>
  );
}
