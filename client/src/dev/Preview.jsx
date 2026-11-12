/**
 * Vista previa de pantallas con datos de ejemplo — SOLO en desarrollo.
 * Abrí http://localhost:5173/?preview=lobby | question | locked | reveal | podium | solo-win | solo-lose
 */
import { GameAdRail } from '../components/AdSlot';
import Station from '../components/Station';
import Lobby from '../screens/Lobby';
import MultiGame from '../screens/MultiGame';
import { MultiResults, SoloResults } from '../screens/Results';

const players = [
  { id: 'a', name: 'Martina', color: '#18b4e9', score: 540, connected: true },
  { id: 'b', name: 'Caro', color: '#e5262f', score: 610, connected: true },
  { id: 'c', name: 'Lucho', color: '#00a05a', score: 380, connected: true },
  { id: 'd', name: 'Sofi', color: '#7b3fa0', score: 610, connected: false },
  { id: 'e', name: 'Tomás', color: '#ff7a1a', score: 120, connected: true },
];
const room = { code: 'KXPR', hostId: 'a', state: 'question', players };
const question = { id: 1, category: 'Geografía', prompt: 'Nombrá un país que empiece con B', validCount: 17 };
const crowd = [
  { id: 1, prompt: 'Nombrá un país que empiece con B', total: 214, top: [{ answer: 'Brasil', picks: 98 }], counts: { 'Benín': 3, Brasil: 98 }, answers: { b: 'Benín', c: 'Brasil' }, mine: 'Benín' },
  { id: 2, prompt: 'Nombrá una marca de alfajores argentinos', total: 87, top: [{ answer: 'Havanna', picks: 31 }], counts: { Havanna: 31 }, answers: { b: 'Havanna' }, mine: 'Havanna' },
  { id: 3, prompt: 'Nombrá un color', total: 1, top: [{ answer: 'Verde Agua', picks: 1 }], counts: { 'Verde Agua': 1 }, answers: { b: 'Verde Agua' }, mine: 'Verde Agua' },
  { id: 4, prompt: 'Nombrá un barrio de CABA', total: 40, top: [{ answer: 'Palermo', picks: 12 }], counts: {}, answers: {}, mine: null },
];
const noop = async () => ({ ok: false, reason: 'invalid' });

function round(extra = {}) {
  const now = Date.now();
  return { index: 3, total: 10, question, startsAt: now - 50, endsAt: now + 14_000, answered: ['a', 'c'], mine: null, ...extra };
}

const SCREENS = {
  lobby: () => <Lobby room={{ ...room, state: 'lobby', players: players.slice(0, 4) }} meId="b" onStart={noop} onLeave={() => {}} connected />,
  question: () => <MultiGame room={room} round={round()} reveal={null} meId="b" onSubmit={noop} onLeave={() => {}} connected />,
  locked: () => <MultiGame room={room} round={round({ mine: { display: 'Benín', points: 100 }, answered: ['a', 'b', 'c'] })} reveal={null} meId="b" onSubmit={noop} onLeave={() => {}} connected />,
  reveal: () => (
    <MultiGame
      room={room}
      round={round()}
      reveal={{
        index: 3,
        nextAt: Date.now() + 4000,
        nextInMs: 5500,
        results: [
          { id: 'b', name: 'Caro', color: '#e5262f', answer: 'Benín', points: 100 },
          { id: 'a', name: 'Martina', color: '#18b4e9', answer: 'Botsuana', points: 60 },
          { id: 'c', name: 'Lucho', color: '#00a05a', answer: 'Brasil', points: 10 },
          { id: 'e', name: 'Tomás', color: '#ff7a1a', answer: null, points: 0 },
        ],
        highlights: [
          { display: 'Burundi', points: 100 },
          { display: 'Bután', points: 100 },
          { display: 'Brunéi', points: 100 },
          { display: 'Barbados', points: 60 },
        ],
      }}
      meId="b"
      onSubmit={noop}
      onLeave={() => {}}
      connected
    />
  ),
  podium: () => <MultiResults ranking={players} rounds={crowd} meId="b" isHost onRestart={() => {}} onLeave={() => {}} />,
  'solo-win': () => <SoloResults score={760} target={700} marks={[100, 60, 100, 30, 100, 60, 100, 10, 100, 100]} rounds={crowd} onRetry={() => {}} onExit={() => {}} />,
  'solo-lose': () => <SoloResults score={410} target={700} marks={[10, 60, 0, 30, 100, 60, 10, 0, 100, 40]} onRetry={() => {}} onExit={() => {}} />,
};

export default function Preview({ name }) {
  const Screen = SCREENS[name];
  return (
    <>
      <Station>{Screen ? <Screen /> : <p className="label-caps m-auto">Previews: {Object.keys(SCREENS).join(' · ')}</p>}</Station>
      <GameAdRail />
    </>
  );
}
