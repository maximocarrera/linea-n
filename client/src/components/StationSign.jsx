import LineBadge from './LineBadge';

/** Cartel de estación: bloque negro con borde, franja amarilla y sombra dura. */
export default function StationSign({ line = 'N', title, subtitle, size = 'lg', className = '' }) {
  const big = size === 'lg';
  return (
    <div className={`relative overflow-hidden border-2 border-rail bg-sign shadow-[6px_6px_0_0_#000] ${className}`}>
      <div className="h-1.5 bg-signal" />
      <div className={`flex items-center gap-3 ${big ? 'px-5 py-4' : 'px-4 py-3'}`}>
        <LineBadge line={line} size={big ? 'lg' : 'md'} />
        <div className="min-w-0">
          <p className={`truncate font-bold tracking-tight uppercase ${big ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{title}</p>
          {subtitle && <p className="truncate text-sm font-medium text-mute">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
