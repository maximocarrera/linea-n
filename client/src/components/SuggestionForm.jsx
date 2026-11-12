import { useId, useState } from 'react';
import { CircleCheck, LoaderCircle, Send } from 'lucide-react';
import { SUGGESTION_MAX, SUGGESTION_MIN } from '@linean/shared';
import { sendSuggestion } from '../lib/api';

/**
 * Formulario del buzón. Sirve para la landing (sugerencia general) y para el final de
 * partida (questionId = pregunta sobre la que opinan). El texto viaja como texto plano:
 * el server lo limpia, lo limita y lo guarda con sentencias preparadas.
 */
export default function SuggestionForm({ questionId = null, label = 'Tu sugerencia', placeholder, compact = false, autoFocus = false }) {
  const uid = useId();
  const [text, setText] = useState('');
  const [trap, setTrap] = useState(''); // campo trampa para bots (invisible)
  const [status, setStatus] = useState({ state: 'idle' }); // idle | sending | sent | error
  const [touched, setTouched] = useState(false);

  const length = text.trim().length;
  const tooShort = length < SUGGESTION_MIN;
  const showShort = touched && length > 0 && tooShort;
  const sending = status.state === 'sending';

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (tooShort || sending) return;
    setStatus({ state: 'sending' });
    try {
      await sendSuggestion({ text, questionId, website: trap });
      setStatus({ state: 'sent' });
      setText('');
      setTouched(false);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (status.state === 'sent') {
    return (
      <div className="flex animate-pop-in flex-wrap items-center justify-between gap-3 border-2 border-line-d bg-line-d/10 px-4 py-3" role="status">
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck className="size-5 shrink-0 text-line-d" aria-hidden />
          ¡Gracias! La leemos en la próxima parada.
        </p>
        <button type="button" onClick={() => setStatus({ state: 'idle' })} className="focus-ring min-h-12 cursor-pointer px-2 text-sm font-bold text-mute uppercase underline-offset-4 hover:text-chalk hover:underline">
          Mandar otra
        </button>
      </div>
    );
  }

  const helpId = `${uid}-help`;
  return (
    <form onSubmit={submit} noValidate className="grid gap-2">
      <label htmlFor={`${uid}-text`} className="label-caps">
        {label}
      </label>
      <textarea
        id={`${uid}-text`}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, SUGGESTION_MAX))}
        onBlur={() => setTouched(true)}
        maxLength={SUGGESTION_MAX}
        rows={compact ? 2 : 4}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-describedby={helpId}
        aria-invalid={showShort || undefined}
        className={`focus-ring w-full resize-y border-2 bg-tunnel px-4 py-3 leading-relaxed outline-none transition-colors placeholder:text-mute/70 focus:border-signal ${
          showShort ? 'border-alert' : 'border-rail'
        } ${compact ? 'min-h-20' : 'min-h-32'}`}
      />
      {/* Trampa para bots: fuera de pantalla, sin foco ni autocompletado. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          No completar
          <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id={helpId} className={`min-h-5 text-sm ${showShort || status.state === 'error' ? 'text-alert' : 'text-mute'}`} aria-live="polite">
          {status.state === 'error'
            ? status.message
            : showShort
              ? `Escribí al menos ${SUGGESTION_MIN} letras.`
              : <span className="font-mono tabular-nums">{text.length}/{SUGGESTION_MAX}</span>}
        </p>
        <button
          type="submit"
          disabled={sending}
          className="press flex min-h-12 cursor-pointer items-center justify-center gap-2 bg-signal px-5 text-sm font-bold text-tunnel uppercase disabled:cursor-wait disabled:opacity-70"
          style={{ '--press-shadow': '#f4f2ea' }}
        >
          {sending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </form>
  );
}
