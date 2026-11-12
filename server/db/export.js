// Crea un archivo .txt por cada pregunta de la base (para pasar a editar todo con archivos).
//   npm run db:export             → no pisa archivos que ya existan
//   npm run db:export -- --force  → los sobrescribe con lo que hay en la base
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../src/db.js';
import { fileNameFor, serializeQuestion } from './questions-file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(process.env.LINEAN_QUESTIONS_DIR ?? path.join(__dirname, '../data/preguntas'));
const force = process.argv.includes('--force');

mkdirSync(DIR, { recursive: true });
const db = openDb();
const questions = db.prepare('SELECT id, category, prompt, active, source FROM questions ORDER BY id').all();
const answersOf = db.prepare('SELECT answer, aliases, points FROM answers WHERE question_id = ? ORDER BY points, id');
const setSource = db.prepare('UPDATE questions SET source = ? WHERE id = ?');

let written = 0;
for (const q of questions) {
  const file = q.source ?? fileNameFor(q.prompt);
  const target = path.join(DIR, file);
  if (existsSync(target) && !force) {
    console.log(`· ${file} ya existe — no se tocó`);
  } else {
    writeFileSync(target, serializeQuestion({ ...q, answers: answersOf.all(q.id) }), 'utf8');
    written++;
    console.log(`✔ ${file}`);
  }
  if (!q.source) setSource.run(file, q.id);
}
console.log(`\n${written} archivo(s) escritos en ${DIR}`);
db.close();
