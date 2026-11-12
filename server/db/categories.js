// Lista las preguntas de la base agrupadas por categoría, con su estado.
//   npm run db:categorias
// Solo lee la base (no modifica nada). Muestra lo que está cargado: si editaste
// un .txt y todavía no corriste npm run db:import, ese cambio no aparece acá.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from '../src/db.js';

if (!existsSync(DB_PATH)) {
  console.log(`No existe la base ${DB_PATH}. Corré npm run db:seed o npm run db:import.`);
  process.exit(0);
}

const db = new DatabaseSync(DB_PATH, { readOnly: true });
const rows = db
  .prepare(
    `SELECT q.id, q.category, q.prompt, q.active, q.source, COUNT(a.id) AS answers
     FROM questions q LEFT JOIN answers a ON a.question_id = q.id
     GROUP BY q.id
     ORDER BY q.category COLLATE NOCASE, q.active DESC, q.prompt COLLATE NOCASE`,
  )
  .all();
db.close();

if (!rows.length) {
  console.log('La base no tiene preguntas todavía.');
  process.exit(0);
}

const groups = new Map();
for (const r of rows) {
  if (!groups.has(r.category)) groups.set(r.category, []);
  groups.get(r.category).push(r);
}

const statusOf = (q) => (!q.active ? 'INACTIVA' : q.answers === 0 ? 'SIN RESP.' : 'activa');
const mark = (q) => (!q.active ? '○' : q.answers === 0 ? '!' : '●');

let active = 0;
for (const [category, qs] of groups) {
  const on = qs.filter((q) => q.active && q.answers > 0).length;
  console.log(`\n${category.toUpperCase()}  (${on}/${qs.length} en juego)`);
  for (const q of qs) {
    console.log(`  ${mark(q)} ${statusOf(q).padEnd(9)} ${String(q.answers).padStart(5)} resp.  ${q.prompt}${q.source ? `   [${q.source}]` : ''}`);
  }
  active += on;
}

console.log(`\n${groups.size} categorías · ${rows.length} preguntas · ${active} en juego · ${rows.length - active} fuera de juego`);
console.log('● activa   ○ inactiva   ! activa pero sin respuestas (no sale en partidas)');
