import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';

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

const ZOOM = 2.5;
const isTouch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

/**
 * Foto grupal ampliada, sin barras de desplazamiento.
 * Compu: arranca entera; un clic acerca en ese punto y se recorre arrastrando con el mouse.
 * Celu: arranca acercada y se recorre arrastrando con el dedo (scroll nativo).
 */
function PanViewer({ image, alt }) {
  const boxRef = useRef(null);
  const [touch] = useState(isTouch);
  const [zoomed, setZoomed] = useState(touch);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const focus = useRef(null); // punto a mantener debajo del cursor al cambiar el zoom

  // Después de cambiar el zoom, deja el punto clickeado donde estaba el cursor (o centra la foto).
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const f = focus.current ?? { fx: 0.5, fy: 0.5, ox: box.clientWidth / 2, oy: box.clientHeight / 2 };
    box.scrollLeft = f.fx * box.scrollWidth - f.ox;
    box.scrollTop = f.fy * box.scrollHeight - f.oy;
    focus.current = null;
  }, [zoomed]);

  const toggleAt = (clientX, clientY) => {
    const box = boxRef.current;
    if (box && clientX != null) {
      const r = box.getBoundingClientRect();
      const ox = clientX - r.left;
      const oy = clientY - r.top;
      focus.current = { fx: (box.scrollLeft + ox) / box.scrollWidth, fy: (box.scrollTop + oy) / box.scrollHeight, ox, oy };
    }
    setZoomed((z) => !z);
  };

  // Solo el mouse arrastra a mano: en pantallas táctiles el scroll nativo ya sigue al dedo.
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const box = boxRef.current;
    drag.current = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop, moved: false };
    box.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) setDragging(true);
    d.moved = true;
    boxRef.current.scrollLeft = d.left - dx;
    boxRef.current.scrollTop = d.top - dy;
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d && !d.moved) toggleAt(e.clientX, e.clientY); // clic sin arrastrar: acerca / aleja
  };

  const cursor = zoomed ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in';

  return (
    <div className="grid gap-2">
      <div className="relative border-2 border-chalk bg-platform-2 p-1.5 shadow-[10px_10px_0_0_#000]">
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
          }}
          className={`max-h-[78dvh] w-[min(calc(100vw-3rem),72rem)] touch-pan-x touch-pan-y overflow-auto overscroll-contain select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${touch ? '' : cursor}`}
        >
          <img
            src={image.src}
            alt={alt}
            draggable={false}
            className="block h-auto max-w-none"
            style={{ width: zoomed ? `${ZOOM * 100}%` : '100%' }}
          />
        </div>
        <button
          type="button"
          onClick={() => toggleAt()}
          aria-label={zoomed ? 'Alejar' : 'Acercar'}
          aria-pressed={zoomed}
          className="press absolute right-3 bottom-3 grid size-12 cursor-pointer place-items-center bg-tunnel/90 text-chalk"
          style={{ '--press-shadow': '#000' }}
        >
          {zoomed ? <ZoomOut className="size-6" aria-hidden /> : <ZoomIn className="size-6" aria-hidden />}
        </button>
      </div>
      <p className="text-center text-sm text-mute">
        {touch ? 'Arrastrá con el dedo para recorrer la foto' : zoomed ? 'Arrastrá para moverte · clic para alejar' : 'Hacé clic donde quieras acercarte'}
      </p>
    </div>
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
          <PanViewer image={image} alt={alt} />
        ) : (
          <div className="border-2 border-chalk bg-platform-2 p-1.5 shadow-[10px_10px_0_0_#000]">
            <img src={image.src} alt={alt} className="max-h-[78dvh] w-auto max-w-full object-contain" />
          </div>
        )}
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
