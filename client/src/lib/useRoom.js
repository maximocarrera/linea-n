import { useCallback, useEffect, useState } from 'react';
import { socket } from './socket';
import { getPlayerId, session } from './storage';
import { getRecent, rememberPlayed } from './recent';

const ROOM_KEY = 'linean:room';

/** Estado del modo multijugador, alimentado por eventos de Socket.io. */
export function useRoom() {
  const [room, setRoom] = useState(null);
  const [round, setRound] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [final, setFinal] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const playerId = getPlayerId();

  useEffect(() => {
    const onConnect = async () => {
      setConnected(true);
      // Reconexión automática (celu bloqueado, cambio de red, recarga de página)
      const saved = session.get(ROOM_KEY);
      if (!saved) return;
      const res = await socket.emitWithAck('room:join', { ...saved, playerId, recent: getRecent() }).catch(() => null);
      if (res?.ok) setRoom(res.room);
      else {
        session.remove(ROOM_KEY);
        setRoom(null);
      }
    };
    const onDisconnect = () => setConnected(false);
    const onRoomUpdate = (data) => {
      setRoom(data);
      if (data.state === 'lobby') {
        setRound(null);
        setReveal(null);
        setFinal(null);
      }
    };
    const onRoundStart = (d) => {
      rememberPlayed(d.question.id);
      const startsAt = Date.now() + d.introMs;
      setRound({ ...d, startsAt, endsAt: startsAt + d.durationMs });
      setReveal(null);
      setFinal(null);
    };
    const onProgress = ({ answered }) => setRound((r) => (r ? { ...r, answered } : r));
    const onRoundEnd = (d) => setReveal({ ...d, nextAt: Date.now() + d.nextInMs });
    const onGameOver = (d) => setFinal(d);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:update', onRoomUpdate);
    socket.on('round:start', onRoundStart);
    socket.on('round:progress', onProgress);
    socket.on('round:end', onRoundEnd);
    socket.on('game:over', onGameOver);

    if (session.get(ROOM_KEY) && !socket.connected) socket.connect();

    // Al volver a la pestaña (iOS congela sockets en segundo plano)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && session.get(ROOM_KEY) && !socket.connected) socket.connect();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:update', onRoomUpdate);
      socket.off('round:start', onRoundStart);
      socket.off('round:progress', onProgress);
      socket.off('round:end', onRoundEnd);
      socket.off('game:over', onGameOver);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [playerId]);

  const call = useCallback((event, payload = {}) => {
    if (!socket.connected) socket.connect();
    return socket
      .timeout(6000)
      .emitWithAck(event, payload)
      .catch(() => ({ error: 'No hay conexión con el servidor.' }));
  }, []);

  const enter = useCallback(
    async (event, payload) => {
      const res = await call(event, { ...payload, playerId, recent: getRecent() });
      if (res?.ok) {
        session.set(ROOM_KEY, { code: res.room.code, name: payload.name });
        setRoom(res.room);
      }
      return res;
    },
    [call, playerId],
  );

  const create = useCallback((name) => enter('room:create', { name }), [enter]);
  const join = useCallback((code, name) => enter('room:join', { code, name }), [enter]);
  const start = useCallback(() => call('room:start'), [call]);
  const restart = useCallback(() => call('room:restart'), [call]);
  const submit = useCallback((text) => call('answer:submit', { text }), [call]);
  const leave = useCallback(() => {
    socket.emit('room:leave');
    session.remove(ROOM_KEY);
    setRoom(null);
    setRound(null);
    setReveal(null);
    setFinal(null);
  }, []);

  return { playerId, connected, room, round, reveal, final, create, join, start, restart, submit, leave };
}
