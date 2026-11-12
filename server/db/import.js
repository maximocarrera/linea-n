// Carga las preguntas de server/data/preguntas/*.txt en la base.
//   npm run db:import                 → valida y carga todos los archivos
//   npm run db:import -- --check      → solo valida, no escribe nada
//   npm run db:import -- seleccion    → solo los archivos cuyo nombre contenga "seleccion"
//
// Cada archivo es la fuente de verdad de SU pregunta: al importar se reemplazan sus respuestas.
// Las preguntas que no tienen archivo quedan como están.
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DB_PATH, openDb } from '../src/db.js';
import { parseQuestionFile } from './questions-file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const QUESTIONS_DIR = path.resolve(process.env.LINEAN_QUESTIONS_DIR ?? path.join(__dirname, '../data/preguntas'));

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const filters = args.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());

if (!existsSync(QUESTIONS_DIR)) mkdirSync(QUESTIONS_DIR, { recursive: true });
const files = readdirSync(QUESTIONS_DIR)
  .filter((f) => f.toLowerCase().endsWith('.txt'))
  .filter((f) => !filters.length || filters.some((x) => f.toLowerCase().includes(x)))
  .sort();

if (!files.length) {
  console.log(`No hay archivos .txt en ${QUESTIONS_DIR}${filters.length ? ` que coincidan con "${filters.join(', ')}"` : ''}.`);
  console.log('Tip: npm run db:export crea un archivo por cada pregunta que ya está en la base.');
  process.exit(0);
}

const db = openDb();
const bySource = db.prepare('SELECT id FROM questions WHERE source = ?');
const byPrompt = db.prepare('SELECT id, source FROM questions WHERE prompt = ?');
const insertQ = db.prepare('INSERT INTO questions (category, prompt, active, source) VALUES (?, ?, ?, ?)');
const updateQ = db.prepare('UPDATE questions SET category = ?, prompt = ?, active = ?, source = ? WHERE id = ?');
const clearA = db.prepare('DELETE FROM answers WHERE question_id = ?');
const insertA = db.prepare('INSERT INTO answers (question_id, answer, aliases, points) VALUES (?, ?, ?, ?)');

let ok = 0;
let failed = 0;
console.log(`${checkOnly ? 'Revisando' : 'Importando'} ${files.length} archivo(s) de ${QUESTIONS_DIR}\n`);

for (const file of files) {
  const parsed = parseQuestionFile(readFileSync(path.join(QUESTIONS_DIR, file), 'utf8'));
  const { meta, answers, errors, warnings, autoAliases } = parsed;
  const tiers = summarize(answers);

  if (errors.length) {
    failed++;
    console.log(`✖ ${file}`);
    for (const e of errors) console.log(`    ${e}`);
    for (const w of warnings) console.log(`    ⚠ ${w}`);
    continue;
  }

  let status = checkOnly ? 'ok' : '';
  if (!checkOnly) {
    try {
      db.exec('BEGIN');
      let id = bySource.get(file)?.id;
      if (!id) {
        const adopt = byPrompt.get(meta.prompt);
        if (adopt?.source && adopt.source !== file) throw new Error(`la consigna ya está en uso por ${adopt.source}`);
        id = adopt?.id;
      }
      if (id) {
        updateQ.run(meta.category, meta.prompt, meta.active ? 1 : 0, file, id);
        status = 'actualizada';
      } else {
        id = Number(insertQ.run(meta.category, meta.prompt, meta.active ? 1 : 0, file).lastInsertRowid);
        status = 'nueva';
      }
      clearA.run(id);
      for (const a of answers) insertA.run(id, a.answer, a.aliases.length ? a.aliases.join('|') : null, a.points);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      failed++;
      console.log(`✖ ${file}\n    ${err.message}`);
      continue;
    }
  }

  ok++;
  const extra = [meta.active ? null : 'INACTIVA', autoAliases ? `+${autoAliases} alias por apellido` : null].filter(Boolean).join(' · ');
  console.log(`✔ ${file} — ${status} · ${answers.length} respuestas (${tiers})${extra ? ` · ${extra}` : ''}`);
  for (const w of warnings.slice(0, 15)) console.log(`    ⚠ ${w}`);
  if (warnings.length > 15) console.log(`    ⚠ …y ${warnings.length - 15} avisos más`);
}

// Preguntas que apuntan a un archivo que ya no existe
const all = new Set(readdirSync(QUESTIONS_DIR));
const orphans = db.prepare('SELECT id, prompt, source FROM questions WHERE source IS NOT NULL').all().filter((q) => !all.has(q.source));
if (orphans.length && !filters.length) {
  console.log('\nPreguntas en la base cuyo archivo ya no existe (no se tocaron; desactivalas a mano si querés):');
  for (const q of orphans) console.log(`    #${q.id} ${q.prompt}  (${q.source})`);
}

console.log(`\n${ok} ok · ${failed} con errores${checkOnly ? ' · modo --check: no se escribió nada' : ` · base: ${DB_PATH}`}`);
db.close();
process.exitCode = failed ? 1 : 0;

function summarize(answers) {
  const count = new Map();
  for (const a of answers) count.set(a.points, (count.get(a.points) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, n]) => `${p}:${n}`)
    .join(' ');
}
