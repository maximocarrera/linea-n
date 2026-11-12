/** Layout base: pared de azulejos + línea amarilla del andén + safe areas de iOS. */
export default function Station({ children, wide = false }) {
  return (
    <div className="tile-wall relative min-h-dvh overflow-x-hidden">
      <div className={`safe-pad relative z-10 mx-auto flex min-h-dvh w-full flex-col gap-5 ${wide ? 'max-w-6xl sm:px-8' : 'max-w-xl'}`}>{children}</div>
      <div aria-hidden className="safety-strip pointer-events-none fixed inset-x-0 bottom-0 z-0 h-1.5 opacity-80" />
    </div>
  );
}
