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
import { prepareImage, pruneImages } from './images.js';
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
const insertQ = db.prepare(
  'INSERT INTO questions (category, prompt, active, source, image, image_credit) VALUES (?, ?, ?, ?, ?, ?)',
);
const updateQ = db.prepare(
  'UPDATE questions SET category = ?, prompt = ?, active = ?, source = ?, image = ?, image_credit = ? WHERE id = ?',
);
const usedImages = new Set();
const clearA = db.prepare('DELETE FROM answers WHERE question_id = ?');
const insertA = db.prepare('INSERT INTO answers (question_id, answer, aliases, points) VALUES (?, ?, ?, ?)');

let ok = 0;
let failed = 0;
console.log(`${checkOnly ? 'Revisando' : 'Importando'} ${files.length} archivo(s) de ${QUESTIONS_DIR}\n`);

// Categorías: "Musica", "música " y "Música" son la misma. Se agrupan sin tildes ni mayúsculas
// y se usa la forma más repetida (con empate, la que tiene tildes).
const parsedFiles = files.map((file) => [file, parseQuestionFile(readFileSync(path.join(QUESTIONS_DIR, file), 'utf8'))]);
const categoryKey = (c) => c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
const spellings = new Map(); // clave -> Map(forma -> veces)
for (const [, { meta }] of parsedFiles) {
  const c = meta.category?.replace(/\s+/g, ' ').trim();
  if (!c) continue;
  const forms = spellings.get(categoryKey(c)) ?? new Map();
  forms.set(c, (forms.get(c) ?? 0) + 1);
  spellings.set(categoryKey(c), forms);
}
const nonAscii = (s) => [...s].filter((ch) => ch > '\x7f').length;
const canonicalCategory = new Map(
  [...spellings].map(([key, forms]) => [key, [...forms].sort((a, b) => b[1] - a[1] || nonAscii(b[0]) - nonAscii(a[0]))[0][0]]),
);

for (const [file, parsed] of parsedFiles) {
  const { meta, answers, errors, warnings, autoAliases } = parsed;
  if (meta.category) {
    const canonical = canonicalCategory.get(categoryKey(meta.category));
    if (canonical !== meta.category) {
      warnings.unshift(`categoría "${meta.category}" se carga como "${canonical}"`);
      meta.category = canonical;
    }
  }

  // Foto opcional: se achica y se guarda en server/data/imagenes/web/.
  let imageName = null;
  let imageNote = null;
  if (meta.image) {
    const img = await prepareImage(meta.image, { checkOnly });
    if (img.error) errors.push(img.error);
    if (img.warning) warnings.unshift(img.warning);
    imageName = img.name;
    imageNote = img.note ?? null;
    if (imageName) usedImages.add(imageName);
    if (imageName && !meta.imageCredit) warnings.unshift('tiene foto pero no "credito:" (autor y licencia de la foto)');
  }
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
        updateQ.run(meta.category, meta.prompt, meta.active ? 1 : 0, file, imageName, meta.imageCredit, id);
        status = 'actualizada';
      } else {
        id = Number(insertQ.run(meta.category, meta.prompt, meta.active ? 1 : 0, file, imageName, meta.imageCredit).lastInsertRowid);
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
  const extra = [meta.active ? null : 'INACTIVA', imageName ? 'con foto' : null, autoAliases ? `+${autoAliases} alias por apellido` : null].filter(Boolean).join(' · ');
  console.log(`✔ ${file} — ${status} · ${answers.length} respuestas (${tiers})${extra ? ` · ${extra}` : ''}`);
  if (imageNote) console.log(`    ${imageNote}`);
  for (const w of warnings.slice(0, 15)) console.log(`    ⚠ ${w}`);
  if (warnings.length > 15) console.log(`    ⚠ …y ${warnings.length - 15} avisos más`);
}

// Preguntas cuyo archivo se borró: se desactivan (no se eliminan, así se conservan sus estadísticas).
const all = new Set(readdirSync(QUESTIONS_DIR));
const orphans = db
  .prepare('SELECT id, prompt, source FROM questions WHERE source IS NOT NULL AND active = 1')
  .all()
  .filter((q) => !all.has(q.source));
if (orphans.length && !filters.length) {
  const deactivate = db.prepare('UPDATE questions SET active = 0 WHERE id = ?');
  console.log(`\nPreguntas cuyo archivo ya no existe (${checkOnly ? 'se desactivarían' : 'desactivadas'}):`);
  for (const q of orphans) {
    if (!checkOnly) deactivate.run(q.id);
    console.log(`    #${q.id} ${q.prompt}  (${q.source})`);
  }
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
