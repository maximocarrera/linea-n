import { MAX_ANSWER, MAX_NAME } from '@linean/shared';
import { parseIds } from './ids.js';

const clean = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function registerSocketHandlers(io, rooms) {
  io.on('connection', (socket) => {
    const reply = (ack, payload) => typeof ack === 'function' && ack(payload);
    const currentRoom = () => rooms.get(socket.data.roomCode);
    const leaveCurrent = () => {
      currentRoom()?.leave(socket.data.playerId);
      if (socket.data.roomCode) socket.leave(`room:${socket.data.roomCode}`);
      socket.data.roomCode = null;
    };
    const identity = (data) => ({
      playerId: clean(data?.playerId, 64),
      name: clean(data?.name, MAX_NAME) || 'Pasajero',
      recent: parseIds(data?.recent), // preguntas que este navegador jugó hace poco
    });

    socket.on('room:create', (data, ack) => {
      const who = identity(data);
      if (!who.playerId) return reply(ack, { error: 'Falta el identificador de jugador' });
      leaveCurrent();
      reply(ack, rooms.create().join(socket, who));
    });

    socket.on('room:join', (data, ack) => {
      const who = identity(data);
      const code = clean(data?.code, 6).toUpperCase();
      if (!who.playerId) return reply(ack, { error: 'Falta el identificador de jugador' });
      const room = rooms.get(code);
      if (!room) return reply(ack, { error: 'No existe esa sala. Revisá el código.' });
      if (socket.data.roomCode && socket.data.roomCode !== code) leaveCurrent();
      reply(ack, room.join(socket, who));
    });

    socket.on('room:start', (_data, ack) => {
      const room = currentRoom();
      reply(ack, room ? room.start(socket.data.playerId) : { error: 'No estás en una sala' });
    });

    socket.on('room:restart', (_data, ack) => {
      const room = currentRoom();
      reply(ack, room ? room.restart(socket.data.playerId) : { error: 'No estás en una sala' });
    });

    socket.on('answer:submit', (data, ack) => {
      const room = currentRoom();
      if (!room) return reply(ack, { ok: false, reason: 'closed' });
      // Anti-spam simple: como mucho un intento cada 250 ms.
      const now = Date.now();
      if (now - (socket.data.lastAnswerAt ?? 0) < 250) return reply(ack, { ok: false, reason: 'slow-down' });
      socket.data.lastAnswerAt = now;
      reply(ack, room.submit(socket.data.playerId, clean(data?.text, MAX_ANSWER)));
    });

    socket.on('room:leave', () => leaveCurrent());

    socket.on('disconnect', () => {
      currentRoom()?.disconnect(socket.data.playerId, socket.id);
    });
  });
}
