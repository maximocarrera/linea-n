import { QUESTIONS_PER_GAME, TERMINAL_STATION } from '@linean/shared';
import AdSlot, { AD_SLOTS } from '../components/AdSlot';
import { CafecitoPanel, SuggestionBox } from '../components/landing/CommunityPanels';
import LineBadge from '../components/LineBadge';
import DepartureBoard from '../components/landing/DepartureBoard';
import NicheTicker from '../components/landing/NicheTicker';
import RarityFare from '../components/landing/RarityFare';
import TicketCard from '../components/landing/TicketCard';
import { useStats } from '../lib/useStats';

/**
 * Portada. Mobile: marca → hero → boleto (acciones) → tarifa → tablero.
 * Desktop: dos columnas, con el boleto fijo (sticky) a la derecha.
 */
export default function Home(props) {
  const stats = useStats();
  const serial = stats.status === 'ready' ? String(stats.data.answers).padStart(6, '0') : '------';

  return (
    <>
      <TopBar status={stats.status} />

      <div className="grid grid-cols-1 gap-8 pb-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-x-14 lg:gap-y-10 lg:pt-6">
        <Hero samples={stats.data?.samples} className="lg:col-start-1" />

        <div className="animate-slide-up self-start lg:sticky lg:top-8 lg:col-start-2 lg:row-span-2 lg:row-start-1" style={{ animationDelay: '160ms' }}>
          <TicketCard {...props} serial={serial} />
        </div>

        <div className="grid animate-slide-up gap-6 lg:col-start-1" style={{ animationDelay: '260ms' }}>
          <RarityFare />
          <DepartureBoard stats={stats} />
          <SuggestionBox />
        </div>
      </div>

      <footer className="mt-4 grid gap-8 border-t-2 border-rail pt-8 pb-4">
        <CafecitoPanel />
        <AdSlot slot={AD_SLOTS.footer} minHeight={100} className="mx-auto w-full max-w-3xl" />
      </footer>
    </>
  );
}

function TopBar({ status }) {
  const pill = {
    loading: { text: 'Conectando…', dot: 'bg-mute' },
    ready: { text: 'En servicio', dot: 'bg-line-d live-dot' },
    error: { text: 'Sin servicio', dot: 'bg-alert' },
  }[status];

  return (
    <nav aria-label="Línea N" className="flex animate-fade-in items-center justify-between gap-4">
      <span className="flex items-center gap-3">
        <LineBadge line="N" />
        <span className="text-xl font-bold tracking-tight uppercase">Línea N</span>
      </span>
      <span role="status" className="flex items-center gap-2 border-2 border-rail px-3 py-1.5 text-sm font-semibold">
        <span className={`size-2.5 rounded-full ${pill.dot}`} aria-hidden />
        {pill.text}
      </span>
    </nav>
  );
}

function Hero({ samples, className = '' }) {
  return (
    <header className={`grid min-w-0 grid-cols-1 gap-6 ${className}`}>
      <p className="label-caps animate-fade-in">Trivia de nicho · {QUESTIONS_PER_GAME} estaciones por viaje</p>

      <h1 className="text-[clamp(3.25rem,14.5vw,6.75rem)] leading-[0.86] font-bold tracking-[-0.045em] uppercase lg:text-[clamp(4rem,6.3vw,6.75rem)]">
        <span className="block animate-slide-up">La obvia</span>
        <span className="block animate-slide-up" style={{ animationDelay: '70ms' }}>
          no <span className="text-mute">te</span>
        </span>
        <span className="mt-2 inline-block animate-slide-up" style={{ animationDelay: '140ms' }}>
          <span className="inline-block -rotate-2 bg-signal px-3 pb-1 text-tunnel shadow-[6px_6px_0_0_#000]">lleva.</span>
        </span>
      </h1>

      <p className="max-w-[36ch] animate-fade-in text-lg leading-relaxed text-mute sm:text-xl" style={{ animationDelay: '220ms' }}>
        Cada parada cambia de línea. Usa tus respuestas de nicho para completar el recorrido: llegá a <strong className="text-signal">{TERMINAL_STATION}</strong>, tu flat white te espera
      </p>

      <NicheTicker samples={samples} />
    </header>
  );
}
