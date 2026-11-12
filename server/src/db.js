import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shuffle } from '@linean/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = path.resolve(process.env.LINEAN_DB ?? path.join(__dirname, '../data/linean.db'));
const SCHEMA = readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');

export function openDb(file = DB_PATH) {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  // WAL: el server puede leer mientras tenés la base abierta en un editor visual.
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Migraciones livianas para bases creadas con versiones anteriores del esquema. */
function migrate(db) {
  const cols = db.prepare('PRAGMA table_info(questions)').all().map((c) => c.name);
  if (!cols.includes('source')) db.exec('ALTER TABLE questions ADD COLUMN source TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_source ON questions(source)');
}

/**
 * Lee preguntas de la base en cada partida (no hay caché), así que lo que edites
 * en la base se ve en la próxima partida sin reiniciar el servidor.
 */
export class QuestionStore {
  constructor(db) {
    this.db = db;
    this.playableIds = db.prepare(`
      SELECT q.id FROM questions q
      WHERE q.active = 1 AND EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id)
    `);
  }

  /** Resumen liviano para la portada: categorías, totales y algunas respuestas de nicho de muestra. */
  stats() {
    const categories = this.db
      .prepare(`
        SELECT q.category AS name, COUNT(DISTINCT q.id) AS questions, COUNT(a.id) AS answers
        FROM questions q JOIN answers a ON a.question_id = q.id
        WHERE q.active = 1
        GROUP BY q.category
        ORDER BY questions DESC, answers DESC, name
      `)
      .all()
      .map((c) => ({ name: c.name, questions: c.questions, answers: c.answers }));
    const samples = this.db
      .prepare(`
        SELECT a.answer, a.points FROM answers a JOIN questions q ON q.id = a.question_id
        WHERE q.active = 1 AND a.points >= 60
        ORDER BY RANDOM() LIMIT 12
      `)
      .all()
      .map((s) => ({ answer: s.answer, points: s.points }));
    return {
      questions: categories.reduce((n, c) => n + c.questions, 0),
      answers: categories.reduce((n, c) => n + c.answers, 0),
      categories,
      samples,
    };
  }

  countPlayable() {
    return this.playableIds.all().length;
  }

  /**
   * Elige `count` preguntas distintas. Primero las que no están en `avoid`;
   * si no alcanzan, completa con las de `avoid` empezando por las jugadas hace más tiempo
   * (`avoid` viene ordenado de más vieja a más nueva).
   */
  pickIds(count, avoid = []) {
    const ids = this.playableIds.all().map((r) => r.id);
    const age = new Map();
    avoid.forEach((id, i) => {
      if (!age.has(id)) age.set(id, i);
    });
    const fresh = shuffle(ids.filter((id) => !age.has(id)));
    const stale = ids.filter((id) => age.has(id)).sort((a, b) => age.get(a) - age.get(b));
    return [...fresh, ...stale].slice(0, count);
  }

  /** Devuelve las preguntas con sus respuestas crudas, en el mismo orden que `ids`. */
  load(ids) {
    if (!ids.length) return [];
    const ph = ids.map(() => '?').join(',');
    const questions = this.db.prepare(`SELECT id, category, prompt FROM questions WHERE id IN (${ph})`).all(...ids);
    const answers = this.db
      .prepare(`SELECT question_id, answer, aliases, points FROM answers WHERE question_id IN (${ph}) ORDER BY id`)
      .all(...ids);

    const byId = new Map(questions.map((q) => [q.id, { id: q.id, category: q.category, prompt: q.prompt, answers: [] }]));
    for (const a of answers) {
      byId.get(a.question_id)?.answers.push({ answer: a.answer, aliases: a.aliases ?? '', points: a.points });
    }
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }

  pickGame(count, avoid = []) {
    return this.load(this.pickIds(count, avoid));
  }
}

/** Formato compacto para mandar al cliente: answers = [respuesta, alias, puntos]. */
export const toWire = (q) => ({
  id: q.id,
  category: q.category,
  prompt: q.prompt,
  answers: q.answers.map((a) => [a.answer, a.aliases, a.points]),
});
