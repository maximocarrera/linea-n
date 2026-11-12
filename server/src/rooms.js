import {
  INTRO_MS,
  LINE_COLORS,
  MAX_PLAYERS,
  QUESTIONS_PER_GAME,
  REVEAL_MS,
  ROUND_SECONDS,
  buildQuestion,
  highlightAnswers,
  matchAnswer,
  publicQuestion,
} from '@linean/shared';

const ROUND_MS = ROUND_SECONDS * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O para no confundir
const LOBBY_DROP_MS = 20_000; // en el lobby, quien se desconecta se va después de este tiempo
const EMPTY_ROOM_TTL = 2 * 60_000;

/**
 * Estados de una sala:
 * lobby → question → reveal → question → ... → finished → (restart) → lobby
 */
export class Room {
  constructor(io, code, store) {
    this.io = io;
    this.code = code;
    this.store = store;
    this.players = new Map(); // playerId -> { id, name, color, score, connected, socketId }
    this.hostId = null;
    this.state = 'lobby';
    this.questions = [];
    this.roundIndex = -1;
    this.roundStartsAt = 0;
    this.roundEndsAt = 0;
    this.answers = new Map(); // playerId -> { input, display, points }
    this.lastReveal = null;
    this.timer = null;
    this.dropTimers = new Map();
    this.lastActivity = Date.now();
  }

  get channel() {
    return `room:${this.code}`;
  }

  get question() {
    return this.questions[this.roundIndex];
  }

  connectedPlayers() {
    return [...this.players.values()].filter((p) => p.connected);
  }

  // ───────────────────────── Jugadores ─────────────────────────

  join(socket, { playerId, name, recent = [] }) {
    let player = this.players.get(playerId);
    if (!player) {
      if (this.state !== 'lobby') return { error: 'La partida ya arrancó. Esperá a la próxima.' };
      if (this.players.size >= MAX_PLAYERS) return { error: 'La sala está llena.' };
      const usedColors = new Set([...this.players.values()].map((p) => p.color));
      const color = LINE_COLORS.find((c) => !usedColors.has(c)) ?? LINE_COLORS[this.players.size % LINE_COLORS.length];
      player = { id: playerId, name, color, score: 0, connected: true, socketId: socket.id, recent };
      this.players.set(playerId, player);
    } else {
      player.recent = recent;
      // Reconexión (p. ej. el celu se bloqueó o perdió señal)
      player.connected = true;
      player.socketId = socket.id;
      player.name = name || player.name;
      clearTimeout(this.dropTimers.get(playerId));
      this.dropTimers.delete(playerId);
    }
    if (!this.hostId || !this.players.get(this.hostId)?.connected) this.hostId = playerId;

    socket.join(this.channel);
    socket.data.roomCode = this.code;
    socket.data.playerId = playerId;
    this.touch();
    this.broadcast();
    this.syncLateJoiner(socket, playerId);
    return { ok: true, room: this.snapshot() };
  }

  leave(playerId) {
    if (!this.players.has(playerId)) return;
    if (this.state === 'lobby' || this.state === 'finished') this.players.delete(playerId);
    else this.players.get(playerId).connected = false;
    this.afterPlayerGone(playerId);
  }

  disconnect(playerId, socketId) {
    const player = this.players.get(playerId);
    // Si ya se reconectó con otro socket, ignoramos el disconnect viejo.
    if (!player || player.socketId !== socketId) return;
    player.connected = false;
    if (this.state === 'lobby') {
      this.dropTimers.set(
        playerId,
        setTimeout(() => {
          if (!this.players.get(playerId)?.connected) {
            this.players.delete(playerId);
            this.broadcast();
          }
        }, LOBBY_DROP_MS),
      );
    }
    this.afterPlayerGone(playerId);
  }

  afterPlayerGone(playerId) {
    if (this.hostId === playerId) this.hostId = this.connectedPlayers()[0]?.id ?? null;
    this.touch();
    this.broadcast();
    if (this.state === 'question') this.maybeEndEarly();
  }

  // ───────────────────────── Partida ─────────────────────────

  start(byPlayerId) {
    if (byPlayerId !== this.hostId) return { error: 'Solo quien creó la sala puede arrancar.' };
    if (this.state !== 'lobby') return { error: 'La partida ya está en curso.' };

    // Evitamos las preguntas que cualquiera de los presentes jugó hace poco.
    const avoid = this.connectedPlayers().flatMap((p) => p.recent ?? []);
    let questions;
    try {
      questions = this.store.pickGame(QUESTIONS_PER_GAME, avoid).map(buildQuestion).filter((q) => q.answers.length > 0);
    } catch (err) {
      console.error('pickGame:', err);
      return { error: 'No se pudo leer la base de preguntas.' };
    }
    if (!questions.length) return { error: 'No hay preguntas cargadas en la base.' };

    for (const p of this.players.values()) p.score = 0;
    this.questions = questions;
    this.roundIndex = -1;
    this.nextRound();
    return { ok: true };
  }

  restart(byPlayerId) {
    if (byPlayerId !== this.hostId) return { error: 'Solo el host puede reiniciar.' };
    if (this.state !== 'finished') return { error: 'La partida no terminó.' };
    clearTimeout(this.timer);
    // Los desconectados no vuelven al lobby
    for (const [id, p] of this.players) {
      if (!p.connected) this.players.delete(id);
      else p.score = 0;
    }
    this.state = 'lobby';
    this.roundIndex = -1;
    this.lastReveal = null;
    this.broadcast();
    return { ok: true };
  }

  nextRound() {
    clearTimeout(this.timer);
    this.roundIndex += 1;
    if (this.roundIndex >= this.questions.length) return this.finish();

    this.answers.clear();
    this.state = 'question';
    this.roundStartsAt = Date.now() + INTRO_MS;
    this.roundEndsAt = this.roundStartsAt + ROUND_MS;
    for (const p of this.players.values()) {
      if (p.connected) this.io.to(p.socketId).emit('round:start', this.roundPayload(p.id));
    }
    this.broadcast();
    // +300 ms de gracia por latencia
    this.timer = setTimeout(() => this.endRound(), this.roundEndsAt - Date.now() + 300);
  }

  roundPayload(playerId) {
    const now = Date.now();
    return {
      index: this.roundIndex,
      total: this.questions.length,
      question: publicQuestion(this.question),
      // Duraciones relativas (no timestamps) para no depender del reloj del celular.
      introMs: Math.max(0, this.roundStartsAt - now),
      durationMs: Math.max(0, this.roundEndsAt - Math.max(now, this.roundStartsAt)),
      answered: [...this.answers.keys()],
      mine: this.answers.get(playerId) ?? null,
    };
  }

  submit(playerId, text) {
    if (this.state !== 'question') return { ok: false, reason: 'closed' };
    if (!this.players.has(playerId)) return { ok: false, reason: 'closed' };
    if (this.answers.has(playerId)) return { ok: false, reason: 'locked' };
    if (!text) return { ok: false, reason: 'invalid' };

    const match = matchAnswer(this.question, text);
    // Respuesta inválida: puede seguir intentando hasta que se acabe el tiempo.
    if (!match) return { ok: false, reason: 'invalid' };

    const entry = { input: text, display: match.display, points: match.points };
    this.answers.set(playerId, entry);
    this.touch();
    this.io.to(this.channel).emit('round:progress', { answered: [...this.answers.keys()] });
    this.maybeEndEarly();
    return { ok: true, ...entry };
  }

  maybeEndEarly() {
    const active = this.connectedPlayers();
    if (active.length > 0 && active.every((p) => this.answers.has(p.id))) {
      clearTimeout(this.timer);
      // Pequeña pausa para que el último vea su confirmación
      this.timer = setTimeout(() => this.endRound(), 700);
    }
  }

  endRound() {
    if (this.state !== 'question') return;
    clearTimeout(this.timer);
    this.state = 'reveal';

    const results = [...this.players.values()].map((p) => {
      const a = this.answers.get(p.id);
      const points = a?.points ?? 0;
      p.score += points;
      return { id: p.id, name: p.name, color: p.color, answer: a?.display ?? null, points };
    });
    results.sort((a, b) => b.points - a.points);

    this.lastReveal = {
      index: this.roundIndex,
      total: this.questions.length,
      results,
      highlights: highlightAnswers(this.question),
      scoreboard: this.scoreboard(),
      nextInMs: REVEAL_MS,
    };
    this.io.to(this.channel).emit('round:end', this.lastReveal);
    this.broadcast();
    this.timer = setTimeout(() => this.nextRound(), REVEAL_MS);
  }

  finish() {
    clearTimeout(this.timer);
    this.state = 'finished';
    this.io.to(this.channel).emit('game:over', { ranking: this.scoreboard() });
    this.broadcast();
  }

  // ───────────────────────── Sync ─────────────────────────

  syncLateJoiner(socket, playerId) {
    if (this.state === 'question') socket.emit('round:start', this.roundPayload(playerId));
    else if (this.state === 'reveal' && this.lastReveal) {
      socket.emit('round:start', this.roundPayload(playerId));
      socket.emit('round:end', this.lastReveal);
    } else if (this.state === 'finished') socket.emit('game:over', { ranking: this.scoreboard() });
  }

  scoreboard() {
    return [...this.players.values()]
      .map(({ id, name, color, score, connected }) => ({ id, name, color, score, connected }))
      .sort((a, b) => b.score - a.score);
  }

  snapshot() {
    return {
      code: this.code,
      hostId: this.hostId,
      state: this.state,
      roundIndex: this.roundIndex,
      totalRounds: this.questions.length || QUESTIONS_PER_GAME,
      players: [...this.players.values()].map(({ id, name, color, score, connected }) => ({ id, name, color, score, connected })),
    };
  }

  broadcast() {
    this.io.to(this.channel).emit('room:update', this.snapshot());
  }

  touch() {
    this.lastActivity = Date.now();
  }

  dispose() {
    clearTimeout(this.timer);
    for (const t of this.dropTimers.values()) clearTimeout(t);
  }
}

export class RoomManager {
  constructor(io, store) {
    this.io = io;
    this.store = store;
    this.rooms = new Map();
    // Limpieza periódica de salas vacías
    setInterval(() => this.sweep(), 30_000).unref();
  }

  get size() {
    return this.rooms.size;
  }

  create() {
    let code;
    do {
      code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
    } while (this.rooms.has(code));
    const room = new Room(this.io, code, this.store);
    this.rooms.set(code, room);
    return room;
  }

  get(code) {
    return code ? this.rooms.get(code) : undefined;
  }

  sweep() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.connectedPlayers().length === 0 && now - room.lastActivity > EMPTY_ROOM_TTL) {
        room.dispose();
        this.rooms.delete(code);
      }
    }
  }
}
