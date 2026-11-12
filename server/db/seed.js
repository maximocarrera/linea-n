// Carga inicial de la base de preguntas.
//   npm run db:seed            → crea la base y la llena si está vacía
//   npm run db:seed -- --reset → BORRA todas las preguntas/respuestas y vuelve a cargar las iniciales
import { DB_PATH, openDb } from '../src/db.js';
import { SEED_QUESTIONS } from './seed-data.js';

const reset = process.argv.includes('--reset');
const db = openDb();

const existing = db.prepare('SELECT COUNT(*) AS n FROM questions').get().n;
if (existing > 0 && !reset) {
  console.log(`La base ya tiene ${existing} preguntas (${DB_PATH}).`);
  console.log('No toqué nada. Si querés empezar de cero: npm run db:seed -- --reset');
  process.exit(0);
}

const insertQuestion = db.prepare('INSERT INTO questions (category, prompt, active) VALUES (?, ?, 1)');
const insertAnswer = db.prepare('INSERT OR IGNORE INTO answers (question_id, answer, aliases, points) VALUES (?, ?, ?, ?)');

let answerCount = 0;
db.exec('BEGIN');
try {
  if (reset) db.exec("DELETE FROM answers; DELETE FROM questions; DELETE FROM sqlite_sequence WHERE name IN ('questions', 'answers');");
  for (const q of SEED_QUESTIONS) {
    const { lastInsertRowid } = insertQuestion.run(q.category, q.prompt);
    for (const a of q.answers) {
      answerCount += insertAnswer.run(Number(lastInsertRowid), a.answer, a.aliases || null, a.points).changes;
    }
  }
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}

console.log(`✔ ${SEED_QUESTIONS.length} preguntas y ${answerCount} respuestas cargadas en ${DB_PATH}`);
db.close();
