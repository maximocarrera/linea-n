import { useEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

/**
 * Foto de la pregunta, como un cartel pegado en el andén: ladeado, con cinta amarilla.
 * En el celu va chica al lado de la consigna (para no empujar el input abajo del teclado);
 * en pantallas grandes, más grande. Tocándola se amplía.
 */
export default function QuestionPhoto({ image, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar foto · ${alt}`}
        className="focus-ring group relative block w-[6.5rem] shrink-0 rotate-2 animate-pop-in cursor-zoom-in self-start sm:w-36 lg:w-48"
        style={{ animationDelay: '120ms' }}
      >
        {/* Cinta */}
        <span className="absolute -top-2.5 left-1/2 z-10 h-5 w-14 -translate-x-1/2 -rotate-3 bg-signal/90 shadow-[2px_2px_0_0_#000] lg:w-20" aria-hidden />
        <span className="block border-2 border-chalk bg-platform-2 p-1 shadow-[6px_6px_0_0_#000] transition-transform duration-200 group-hover:-rotate-1 lg:p-1.5">
          <span className="relative block aspect-[4/5] overflow-hidden bg-platform">
            <img
              src={image.src}
              alt={alt}
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={`size-full object-cover object-top transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
            <span className="absolute right-1 bottom-1 grid size-7 place-items-center bg-tunnel/80 text-chalk lg:size-8" aria-hidden>
              <Maximize2 className="size-3.5 lg:size-4" />
            </span>
          </span>
        </span>
      </button>

      {open && <PhotoZoom image={image} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * Categoría Foto: la foto es la pregunta. Va a todo el ancho, como un afiche del andén.
 * Tocándola se abre en grande y se puede recorrer (en el celu, una foto grupal con 80 caras
 * no se lee entera en 360 px).
 */
export function HeroPhoto({ image, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <figure className="grid gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar foto · ${alt}`}
        className="focus-ring group relative block w-full animate-pop-in cursor-zoom-in border-2 border-chalk bg-platform-2 p-1 shadow-[6px_6px_0_0_#000]"
        style={{ animationDelay: '120ms' }}
      >
        <span className="relative block min-h-40 overflow-hidden bg-platform">
          <img
            src={image.src}
            alt={alt}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`mx-auto max-h-[52dvh] w-auto max-w-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
          <span className="absolute right-2 bottom-2 flex min-h-9 items-center gap-1.5 bg-tunnel/85 px-2.5 font-mono text-xs font-bold text-chalk uppercase" aria-hidden>
            <Maximize2 className="size-4" /> Ampliar
          </span>
        </span>
      </button>
      {image.credit && <figcaption className="font-mono text-xs text-mute">Foto: {image.credit}</figcaption>}
      {open && <PhotoZoom image={image} alt={alt} onClose={() => setOpen(false)} pan />}
    </figure>
  );
}

function PhotoZoom({ image, alt, onClose, pan = false }) {
  const closeRef = useRef(null);
  // El reloj de la ronda redibuja al padre cada segundo: guardamos onClose en un ref para
  // que el efecto corra una sola vez y no mueva el foco a cada rato.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-tunnel/90 p-4 backdrop-blur-sm"
    >
      <figure className="relative grid max-h-full max-w-full animate-pop-in gap-3" onClick={(e) => e.stopPropagation()}>
        {pan ? (
          // Foto grupal: en pantallas chicas se muestra más grande que la pantalla y se recorre arrastrando.
          <div className="max-h-[80dvh] max-w-[calc(100vw-2rem)] overflow-auto overscroll-contain border-2 border-chalk bg-platform-2 p-1.5 shadow-[10px_10px_0_0_#000]">
            <img src={image.src} alt={alt} className="block h-auto w-[max(100%,min(1600px,220vw))] max-w-none" />
          </div>
        ) : (
          <div className="border-2 border-chalk bg-platform-2 p-1.5 shadow-[10px_10px_0_0_#000]">
            <img src={image.src} alt={alt} className="max-h-[78dvh] w-auto max-w-full object-contain" />
          </div>
        )}
        {pan && <p className="text-center text-sm text-mute lg:hidden">Arrastrá para recorrer la foto</p>}
        {image.credit && <figcaption className="text-center font-mono text-xs text-mute">Foto: {image.credit}</figcaption>}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar foto"
          className="press absolute -top-4 -right-4 grid size-12 cursor-pointer place-items-center bg-signal text-tunnel"
          style={{ '--press-shadow': '#000' }}
        >
          <X className="size-6" aria-hidden />
        </button>
      </figure>
    </div>
  );
}
