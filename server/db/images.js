// Fotos de las preguntas.
//
//   server/data/imagenes/adam-sandler.jpg        ← la foto original (la que subís vos)
//   server/data/imagenes/web/adam-sandler.3f9a1c2b7d.webp  ← la versión liviana que ve el juego
//
// `npm run db:import` arma la versión web: la achica a 720 px de ancho y la pasa a WebP.
// El nombre lleva un pedazo del hash del original, así que si cambiás la foto cambia el
// nombre y los navegadores bajan la nueva (las fotos se cachean un año).
// La carpeta web/ se sube a git: el server en Railway no necesita convertir nada.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const IMAGES_DIR = path.resolve(process.env.LINEAN_IMAGES_DIR ?? path.join(__dirname, '../data/imagenes'));
export const IMAGES_WEB_DIR = path.join(IMAGES_DIR, 'web');

const WIDTH = 720;
const QUALITY = 78;
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp']);

let sharpPromise;
const loadSharp = () => (sharpPromise ??= import('sharp').then((m) => m.default).catch(() => null));

/**
 * Prepara la versión web de `file` (nombre dentro de server/data/imagenes/).
 * @returns {Promise<{ name: string|null, error?: string, warning?: string, note?: string }>}
 */
export async function prepareImage(file, { checkOnly = false } = {}) {
  const source = path.join(IMAGES_DIR, file);
  const ext = path.extname(file).toLowerCase();
  if (file.includes('/') || file.includes('\\')) return { name: null, error: `imagen "${file}": poné solo el nombre del archivo, sin carpetas` };
  if (!ALLOWED.has(ext)) return { name: null, error: `imagen "${file}": tiene que ser .jpg, .png o .webp` };
  if (!existsSync(source)) return { name: null, error: `imagen "${file}": no está en server/data/imagenes/` };

  const bytes = readFileSync(source);
  const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 10);
  const base = path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const webName = `${base}.${hash}.webp`;
  if (existsSync(path.join(IMAGES_WEB_DIR, webName))) return { name: webName };

  // Sin sharp (p. ej. un server sin dependencias de desarrollo): se sirve el original tal cual.
  const rawName = `${base}.${hash}${ext}`;
  if (existsSync(path.join(IMAGES_WEB_DIR, rawName))) return { name: rawName };
  if (checkOnly) return { name: webName };

  mkdirSync(IMAGES_WEB_DIR, { recursive: true });
  const sharp = await loadSharp();
  if (!sharp) {
    copyFileSync(source, path.join(IMAGES_WEB_DIR, rawName));
    return { name: rawName, warning: `imagen "${file}": no se pudo achicar (falta sharp), se usa el original` };
  }
  const out = await sharp(bytes).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
  writeFileSync(path.join(IMAGES_WEB_DIR, webName), out);
  return { name: webName, note: `foto achicada: ${kb(bytes.length)} → ${kb(out.length)}` };
}

/** Borra de web/ las versiones que ya no usa ninguna pregunta. */
export function pruneImages(used) {
  if (!existsSync(IMAGES_WEB_DIR)) return [];
  const removed = readdirSync(IMAGES_WEB_DIR).filter((f) => !used.has(f));
  for (const f of removed) unlinkSync(path.join(IMAGES_WEB_DIR, f));
  return removed;
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
