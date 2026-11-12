import { useEffect, useState } from 'react';
import Station from './components/Station';
import { local } from './lib/storage';
import { useRoom } from './lib/useRoom';
import Home from './screens/Home';
import Lobby from './screens/Lobby';
import MultiGame from './screens/MultiGame';
import { MultiResults } from './screens/Results';
import SoloGame, { WaitingTrain } from './screens/SoloGame';

const initialCode = new URLSearchParams(location.search).get('sala')?.toUpperCase().slice(0, 4) ?? '';

export default function App() {
  const [name, setNameState] = useState(() => local.get('linean:name', ''));
  const [soloRun, setSoloRun] = useState(0); // 0 = no está jugando solo; cada número = una partida nueva
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const mp = useRoom();

  const setName = (v) => {
    setNameState(v);
    local.set('linean:name', v);
  };

  // Una vez dentro de la sala, sacamos ?sala= de la URL
  useEffect(() => {
    if (mp.room && location.search) history.replaceState(null, '', location.pathname);
  }, [mp.room]);

  async function enter(action) {
    setBusy(true);
    setError(null);
    const res = await action();
    setBusy(false);
    if (!res?.ok) setError(res?.error ?? 'No se pudo conectar.');
  }

  let screen;
  let wide = false;
  if (soloRun > 0) {
    screen = <SoloGame key={soloRun} onRetry={() => setSoloRun((n) => n + 1)} onExit={() => setSoloRun(0)} />;
  } else if (mp.room) {
    const { room } = mp;
    if (room.state === 'lobby') {
      screen = <Lobby room={room} meId={mp.playerId} onStart={mp.start} onLeave={mp.leave} connected={mp.connected} />;
    } else if (room.state === 'finished' && mp.final) {
      screen = <MultiResults ranking={mp.final.ranking} meId={mp.playerId} isHost={room.hostId === mp.playerId} onRestart={mp.restart} onLeave={mp.leave} />;
    } else if (mp.round) {
      screen = <MultiGame room={room} round={mp.round} reveal={mp.reveal} meId={mp.playerId} onSubmit={mp.submit} onLeave={mp.leave} connected={mp.connected} />;
    } else {
      screen = <WaitingTrain />;
    }
  } else {
    wide = true;
    screen = (
      <Home
        name={name}
        setName={setName}
        initialCode={initialCode}
        busy={busy}
        error={error}
        onSolo={() => setSoloRun(1)}
        onCreate={() => enter(() => mp.create(name.trim()))}
        onJoin={(code) => enter(() => mp.join(code, name.trim()))}
      />
    );
  }

  return <Station wide={wide}>{screen}</Station>;
}
