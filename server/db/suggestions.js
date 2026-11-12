// Lee el buzón de sugerencias que dejan los jugadores.
//   npm run db:sugerencias               → las últimas 50, agrupadas (generales / por pregunta)
//   npm run db:sugerencias -- --todas    → todas
//   npm run db:sugerencias -- --borrar 4,7   → borra esas (por número #)
// En Railway: abrí una consola del servicio (railway ssh) y corré el mismo comando.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH, openDb } from '../src/db.js';

const args = process.argv.slice(2);
const flag = (name) => args.indexOf(name);

if (!existsSync(DB_PATH)) {
  console.log(`No existe la base ${DB_PATH}. Corré npm run db:import.`);
  process.exit(0);
}

const del = flag('--borrar');
if (del !== -1) {
  const ids = String(args[del + 1] ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (!ids.length) {
    console.log('Indicá qué borrar, ej.: npm run db:sugerencias -- --borrar 4,7');
    process.exit(1);
  }
  const db = openDb();
  const stmt = db.prepare('DELETE FROM suggestions WHERE id = ?');
  const removed = ids.reduce((n, id) => n + Number(stmt.run(id).changes), 0);
  db.close();
  console.log(`Borradas: ${removed} de ${ids.length}.`);
  process.exit(0);
}

const db = new DatabaseSync(DB_PATH, { readOnly: true });
const hasTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'suggestions'").get();
if (!hasTable) {
  console.log('Todavía no hay buzón (se crea la primera vez que arranca el servidor).');
  process.exit(0);
}
const total = db.prepare('SELECT COUNT(*) AS n FROM suggestions').get().n;
const limit = flag('--todas') !== -1 ? -1 : 50;
const rows = db
  .prepare('SELECT id, question_id, question_prompt, text, created_at FROM suggestions ORDER BY id DESC LIMIT ?')
  .all(limit);
db.close();

if (!rows.length) {
  console.log('El buzón está vacío.');
  process.exit(0);
}

// El texto ya se limpia al guardarlo; esto es una segunda barrera para que nada
// raro (códigos de escape) llegue a la consola.
const safe = (s) => String(s ?? '').replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F]/g, '');
const indent = (s) => safe(s).split('\n').join('\n      ');
const when = (iso) => `${iso.slice(0, 16)} UTC`;

const groups = new Map();
for (const r of rows) {
  const key = r.question_prompt ? `Pregunta #${r.question_id} · ${safe(r.question_prompt)}` : 'Generales';
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

for (const [title, list] of groups) {
  console.log(`\n${title}  (${list.length})`);
  for (const r of list) console.log(`  #${r.id}  ${when(r.created_at)}\n      ${indent(r.text)}`);
}
console.log(`\n${rows.length} de ${total} sugerencias${rows.length < total ? ' · usá --todas para ver el resto' : ''}.`);
