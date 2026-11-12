import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { MAX_ANSWER } from '@linean/shared';

const MESSAGES = {
  invalid: 'No figura en el mapa. Probá con otra.',
  locked: 'Ya respondiste esta estación.',
  closed: 'Se cerraron las puertas: tiempo terminado.',
  'slow-down': 'Más despacio, de a una respuesta.',
};

const SHAKE = [
  { transform: 'translate3d(0,0,0)' },
  { transform: 'translate3d(-10px,0,0)' },
  { transform: 'translate3d(8px,0,0)' },
  { transform: 'translate3d(-5px,0,0)' },
  { transform: 'translate3d(0,0,0)' },
];

/**
 * Input de respuesta. `onSubmit(text)` devuelve { ok, reason }.
 * Si es inválida, sacude el campo (Web Animations API, sin re-montar → no pierde el foco
 * ni cierra el teclado del celular) y deja seguir intentando.
 */
export default function AnswerInput({ onSubmit, disabled }) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState(null);
  const [sending, setSending] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!disabled) inputRef.current?.focus({ preventScroll: true });
  }, [disabled]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled || sending) return;
    setSending(true);
    const res = await onSubmit(text);
    setSending(false);
    if (res?.ok) {
      setMessage(null);
      return;
    }
    setMessage(res?.error ?? MESSAGES[res?.reason] ?? MESSAGES.invalid);
    boxRef.current?.animate(SHAKE, { duration: 380, easing: 'ease-out' });
    navigator.vibrate?.(50);
    inputRef.current?.select();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={id} className="label-caps">
        Tu respuesta
      </label>
      <div ref={boxRef} className="mt-2 flex gap-3 will-change-transform">
        <input
          id={id}
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (message) setMessage(null);
          }}
          disabled={disabled}
          maxLength={MAX_ANSWER}
          placeholder="Escribí y mandá…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="send"
          aria-invalid={Boolean(message)}
          aria-describedby={`${id}-msg`}
          className={`focus-ring min-h-14 min-w-0 flex-1 border-2 bg-tunnel px-4 text-lg font-semibold text-chalk outline-none transition-colors placeholder:text-mute/70 focus:border-signal disabled:opacity-50 ${
            message ? 'border-alert' : 'border-rail'
          }`}
        />
        <button
          type="submit"
          disabled={disabled || sending || !value.trim()}
          className="press flex min-h-14 min-w-14 shrink-0 cursor-pointer items-center justify-center bg-signal px-4 text-tunnel disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          style={{ '--press-shadow': '#f4f2ea' }}
        >
          {sending ? <LoaderCircle className="size-6 animate-spin" aria-hidden /> : <ArrowRight className="size-6" aria-hidden />}
          <span className="sr-only">Enviar respuesta</span>
        </button>
      </div>
      <p id={`${id}-msg`} role="status" className={`mt-2 min-h-5 text-sm font-semibold text-[#ff8a8b] transition-opacity ${message ? 'opacity-100' : 'opacity-0'}`}>
        {message ?? ' '}
      </p>
    </form>
  );
}
