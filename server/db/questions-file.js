// Formato de archivo de pregunta (server/data/preguntas/*.txt) — parseo y escritura.
//
//   # comentario
//   categoria: Fútbol
//   consigna: Nombrá un jugador que haya jugado en la Selección Argentina
//   activa: si
//   apellidos: si          ← agrega el apellido como alias cuando no es ambiguo
//
//   [10]                   ← también vale [comun], [poco], [rara], [nicho]
//   Lionel Messi | Leo Messi
//   Diego Maradona | Diego Armando Maradona
//
//   [100]
//   ...un nombre por renglón...
import { normalize } from '@linean/shared';

const TIER_WORDS = {
  comun: 10,
  'poco comun': 30,
  poco: 30,
  rara: 60,
  raro: 60,
  nicho: 100,
  'de nicho': 100,
};
const YES = new Set(['si', 'yes', 'true', '1']);
const NO = new Set(['no', 'false', '0']);
const META_KEYS = { categoria: 'category', consigna: 'prompt', pregunta: 'prompt', activa: 'active', apellidos: 'surnames' };

/**
 * @returns {{ meta, answers: {answer, aliases, points, line}[], errors: string[], warnings: string[], autoAliases: number }}
 */
export function parseQuestionFile(input) {
  let text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const errors = [];
  const warnings = [];
  if (text.includes('�')) warnings.push('Hay caracteres rotos (�): guardá el archivo como UTF-8.');

  const meta = { category: null, prompt: null, active: true, surnames: false };
  const raw = [];
  let points = null;

  text.split(/\r?\n/).forEach((original, i) => {
    const line = original.trim();
    const n = i + 1;
    if (!line || line.startsWith('#') || line.startsWith('//')) return;

    // "[60]" o "[60]  # comentario" / "[60] // comentario"
    const tier = line.match(/^\[([^\]]+)\]\s*(?:(?:#|\/\/).*)?$/);
    if (!tier && line.startsWith('[')) {
      errors.push(`línea ${n}: "${line}" parece un nivel pero está mal escrito — usá solo [10], [30], [60] o [100] (los comentarios van con #)`);
      return;
    }
    if (tier) {
      const value = normalize(tier[1]);
      const p = /^\d+$/.test(value) ? Number(value) : TIER_WORDS[value];
      if (!p) errors.push(`línea ${n}: nivel desconocido "${tier[1]}" — usá [10], [30], [60], [100] o [comun], [poco], [rara], [nicho]`);
      else points = p;
      return;
    }

    if (points === null) {
      const m = line.match(/^([^:|]+):\s*(.*)$/);
      const key = m && META_KEYS[normalize(m[1])];
      if (!key) {
        errors.push(`línea ${n}: "${line}" está antes del primer nivel ([10], [30], [60], [100])`);
        return;
      }
      const value = m[2].trim();
      if (key === 'active' || key === 'surnames') {
        const v = normalize(value);
        if (YES.has(v)) meta[key] = true;
        else if (NO.has(v)) meta[key] = false;
        else errors.push(`línea ${n}: "${m[1].trim()}" tiene que ser "si" o "no"`);
      } else meta[key] = value;
      return;
    }

    const [answer, ...aliases] = line.split('|').map((s) => s.trim()).filter(Boolean);
    if (answer) raw.push({ answer, aliases, points, line: n });
  });

  if (!meta.category) errors.push('falta "categoria: ..." al principio del archivo');
  if (!meta.prompt) errors.push('falta "consigna: ..." al principio del archivo');
  if (!raw.length && !errors.length) warnings.push('no tiene respuestas todavía');

  // Duplicados: cada clave normalizada pertenece a una sola respuesta.
  const owner = new Map(); // clave normalizada → índice en `answers`
  const answers = [];
  for (const r of raw) {
    const mainKey = normalize(r.answer);
    if (!mainKey) continue;
    if (owner.has(mainKey)) {
      const prev = answers[owner.get(mainKey)];
      warnings.push(`línea ${r.line}: "${r.answer}" repite la línea ${prev.line} — se ignora`);
      continue;
    }
    const idx = answers.length;
    owner.set(mainKey, idx);
    const aliases = [];
    for (const alias of r.aliases) {
      const k = normalize(alias);
      if (!k || k === mainKey) continue;
      if (owner.has(k) && owner.get(k) !== idx) {
        warnings.push(`línea ${r.line}: el alias "${alias}" ya es de "${answers[owner.get(k)].answer}" — se ignora`);
        continue;
      }
      owner.set(k, idx);
      aliases.push(alias);
    }
    answers.push({ answer: r.answer, aliases, points: r.points, line: r.line });
  }

  let autoAliases = 0;
  if (meta.surnames) autoAliases = addSurnameAliases(answers, owner);

  return { meta, answers, errors, warnings, autoAliases };
}

/**
 * "Lionel Messi" → alias "Messi"; "Ángel Di María" → "Di María"; "Juan Román Riquelme" → "Riquelme" y "Román Riquelme".
 * Solo se agrega si nadie más en la lista comparte ese apellido (con 3 "Martínez" no se agrega ninguno).
 */
const PARTICLES = new Set(['de', 'di', 'del', 'da', 'das', 'do', 'dos', 'la', 'le', 'van', 'von', 'mac', 'mc', 'san', 'y']);

function addSurnameAliases(answers, owner) {
  const candidatesOf = (name) => {
    const words = name.split(/\s+/);
    if (words.length < 2) return [];
    const out = new Map();
    // "Ángel Di María": no proponer "María" sola (apellido compuesto con partícula)
    const lastAlone = words.length >= 3 && PARTICLES.has(normalize(words.at(-2))) ? [] : [words.at(-1)];
    for (const c of [...lastAlone, words.slice(1).join(' ')]) {
      const k = normalize(c);
      if (k.length >= 4) out.set(k, c);
    }
    return [...out.entries()];
  };

  const count = new Map();
  for (const a of answers) for (const [k] of candidatesOf(a.answer)) count.set(k, (count.get(k) ?? 0) + 1);

  let added = 0;
  answers.forEach((a, idx) => {
    for (const [k, text] of candidatesOf(a.answer)) {
      if (count.get(k) !== 1 || owner.has(k)) continue;
      owner.set(k, idx);
      a.aliases.push(text);
      added++;
    }
  });
  return added;
}

/** Arma el texto de un archivo de pregunta (para db:export). */
export function serializeQuestion({ category, prompt, active, answers }) {
  const byPoints = new Map();
  for (const a of answers) {
    if (!byPoints.has(a.points)) byPoints.set(a.points, []);
    byPoints.get(a.points).push(a);
  }
  const tiers = [...byPoints.keys()].sort((a, b) => a - b);
  const lines = [
    '# Línea N · una pregunta por archivo. Después de editar: npm run db:import',
    '# Un nombre por renglón. Variantes con |   ej: Benín | Benin | Dahomey',
    '# Niveles: [10] común · [30] poco común · [60] rara · [100] de nicho',
    '',
    `categoria: ${category}`,
    `consigna: ${prompt}`,
    `activa: ${active ? 'si' : 'no'}`,
    'apellidos: no',
  ];
  for (const p of tiers) {
    lines.push('', `[${p}]`);
    for (const a of byPoints.get(p)) lines.push([a.answer, ...String(a.aliases ?? '').split('|').map((s) => s.trim()).filter(Boolean)].join(' | '));
  }
  return lines.join('\n') + '\n';
}

/** "Nombrá un país que empiece con B" → "pais-que-empiece-con-b.txt" */
export function fileNameFor(prompt) {
  const slug = normalize(prompt)
    .replace(/^nombra (un |una )?/, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${slug || 'pregunta'}.txt`;
}
