// Fotos de las preguntas.
//
//   imagen: adam-sandler.jpg                     ← archivo que pusiste en server/data/imagenes/
//   imagen: https://commons.wikimedia.org/wiki/File:Brad_Pitt_PF.jpg   ← link de Wikimedia Commons
//
// Con un link de Commons, `npm run db:import` baja la foto a server/data/imagenes/commons/
// junto con un .json que guarda autor y licencia (de ahí sale el crédito si no pusiste "credito:").
// Se baja una sola vez: después se usa lo guardado, así que el server no necesita internet.
//
// En los dos casos arma la versión web en server/data/imagenes/web/: 720 px de ancho, WebP.
// El nombre lleva un pedazo del hash del original, así que si cambiás la foto cambia el
// nombre y los navegadores bajan la nueva (las fotos se cachean un año).
// Las carpetas commons/ y web/ se suben a git.
import { createHash } from 'node:crypto';
import dns from 'node:dns';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// upload.wikimedia.org le devuelve 429 a algunas direcciones IPv6 de proveedores de casa
// (y no se le pasa) mientras que por IPv4 baja normal: se prueba IPv4 primero.
dns.setDefaultResultOrder('ipv4first');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const IMAGES_DIR = path.resolve(process.env.LINEAN_IMAGES_DIR ?? path.join(__dirname, '../data/imagenes'));
export const IMAGES_WEB_DIR = path.join(IMAGES_DIR, 'web');
const COMMONS_DIR = path.join(IMAGES_DIR, 'commons');

const WIDTH = 720;
const QUALITY = 78;
const DOWNLOAD_WIDTH = 1200; // Commons entrega una versión de este ancho: no hace falta bajar el original
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
// Wikimedia pide un contacto en el User-Agent; sin eso limita mucho más rápido (429).
const USER_AGENT = 'LineaN-question-import/1.0 (https://lineanicho.com; trivia game, downloads question photos from Wikimedia Commons)';

let sharpPromise;
const loadSharp = () => (sharpPromise ??= import('sharp').then((m) => m.default).catch(() => null));

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'foto';

/**
 * Prepara la versión web de la foto de una pregunta.
 * @param {string} ref nombre de archivo en server/data/imagenes/ o link de Wikimedia Commons
 * @returns {Promise<{ name: string|null, credit?: string, error?: string, warning?: string, note?: string }>}
 */
export async function prepareImage(ref, { checkOnly = false } = {}) {
  let source;
  let credit;
  let note;
  if (/^https?:\/\//i.test(ref)) {
    const commons = await fromCommons(ref, { checkOnly });
    if (commons.error || commons.warning || !commons.source) return { name: null, ...commons };
    ({ source, credit, note } = commons);
  } else {
    if (ref.includes('/') || ref.includes('\\')) return { name: null, error: `imagen "${ref}": poné solo el nombre del archivo, sin carpetas` };
    source = path.join(IMAGES_DIR, ref);
    if (!existsSync(source)) return { name: null, error: `imagen "${ref}": no está en server/data/imagenes/` };
  }

  const file = path.basename(source);
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED.has(ext)) return { name: null, error: `imagen "${file}": tiene que ser .jpg, .png o .webp` };

  const bytes = readFileSync(source);
  const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 10);
  const base = slugify(path.basename(file, path.extname(file)));
  const webName = `${base}.${hash}.webp`;
  if (existsSync(path.join(IMAGES_WEB_DIR, webName))) return { name: webName, credit, note };

  // Sin sharp (p. ej. un server sin dependencias de desarrollo): se sirve el original tal cual.
  const rawName = `${base}.${hash}${ext}`;
  if (existsSync(path.join(IMAGES_WEB_DIR, rawName))) return { name: rawName, credit, note };
  if (checkOnly) return { name: webName, credit, note };

  mkdirSync(IMAGES_WEB_DIR, { recursive: true });
  const sharp = await loadSharp();
  if (!sharp) {
    copyFileSync(source, path.join(IMAGES_WEB_DIR, rawName));
    return { name: rawName, credit, note, warning: `imagen "${file}": no se pudo achicar (falta sharp), se usa el original` };
  }
  const out = await sharp(bytes).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
  writeFileSync(path.join(IMAGES_WEB_DIR, webName), out);
  return { name: webName, credit, note: [note, `foto achicada: ${kb(bytes.length)} → ${kb(out.length)}`].filter(Boolean).join(' · ') };
}

/** Baja (una sola vez) una foto de Wikimedia Commons con su autor y licencia. */
async function fromCommons(url, { checkOnly }) {
  const title = commonsTitle(url);
  if (!title) return { error: `imagen: "${url}" no parece un link de Wikimedia Commons (tiene que tener "File:" o "Archivo:")` };

  const base = slugify(title.replace(/\.[a-z0-9]+$/i, ''));
  const metaPath = path.join(COMMONS_DIR, `${base}.json`);
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    const source = path.join(COMMONS_DIR, meta.file);
    if (meta.title === title && existsSync(source)) return { source, credit: meta.credit };
  }
  if (checkOnly) return { note: 'la foto de Commons se baja al importar' };

  let info;
  try {
    const api = new URL('https://commons.wikimedia.org/w/api.php');
    api.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      titles: `File:${title}`,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime',
      iiurlwidth: String(DOWNLOAD_WIDTH),
    });
    const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Commons respondió ${res.status}`);
    const page = (await res.json()).query?.pages?.[0];
    info = page?.imageinfo?.[0];
    if (!info) return { error: `imagen: no encontré "File:${title}" en Wikimedia Commons` };
  } catch (err) {
    return { warning: `imagen: no se pudo consultar Wikimedia Commons (${err.message}); se carga sin foto y se reintenta en el próximo import` };
  }

  const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[info.mime];
  if (!ext) return { error: `imagen "${title}": es ${info.mime}; tiene que ser JPG, PNG o WebP` };

  const downloadUrl = info.thumburl || info.url;
  let bytes;
  try {
    const res = await fetch(downloadUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`respondió ${res.status}`);
    bytes = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    return { warning: `imagen: no se pudo bajar la foto de Commons (${err.message}); se carga sin foto y se reintenta en el próximo import` };
  }

  const m = info.extmetadata ?? {};
  const author =
    cleanHtml(m.Artist?.value) || cleanHtml(m.Attribution?.value) || accountFromUrl(m.Artist?.value) || 'Autor desconocido';
  const license = cleanHtml(m.LicenseShortName?.value) || 'licencia desconocida';
  const credit = `${author} · ${license} · Wikimedia Commons`;

  mkdirSync(COMMONS_DIR, { recursive: true });
  const file = `${base}${ext}`;
  writeFileSync(path.join(COMMONS_DIR, file), bytes);
  writeFileSync(
    metaPath,
    JSON.stringify({ title, file, author, license, credit, page: info.descriptionurl, downloaded: new Date().toISOString().slice(0, 10) }, null, 2) + '\n',
  );
  return { source: path.join(COMMONS_DIR, file), credit, note: `bajada de Commons (${kb(bytes.length)}) · crédito: ${credit}` };
}

/** "https://commons.wikimedia.org/wiki/File:Brad_Pitt_PF.jpg" → "Brad Pitt PF.jpg" */
function commonsTitle(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)wiki(media|pedia)\.org$/i.test(u.hostname)) return null;
  const raw = u.searchParams.get('title') ?? decodeURIComponent(u.pathname.split('/').pop() ?? '');
  const hashFile = decodeURIComponent(u.hash.replace(/^#\/media\//, ''));
  const candidate = /^(File|Archivo|Image|Imagen):/i.test(hashFile) ? hashFile : raw;
  const m = candidate.match(/^(?:File|Archivo|Image|Imagen):(.+)$/i);
  return m ? m[1].replace(/_/g, ' ').trim() : null;
}

/** Cuando el autor es solo un link ("https://www.flickr.com/photos/culturacdmx/") → "culturacdmx (Flickr)". */
function accountFromUrl(html) {
  const url = String(html ?? '').match(/https?:\/\/[^\s"<]+/)?.[0];
  if (!url) return '';
  try {
    const u = new URL(url);
    const site = u.hostname.replace(/^www\./, '').split('.')[0];
    const parts = u.pathname.split('/').filter(Boolean);
    const account = site === 'flickr' ? parts[1] : parts[0];
    const siteName = site.charAt(0).toUpperCase() + site.slice(1);
    return account ? `${account} (${siteName})` : siteName;
  } catch {
    return '';
  }
}

/** El autor viene en HTML (links, spans): queda solo el texto. */
const cleanHtml = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s*(?:\b(?:at|from)\s+)?https?:\/\/\S+/gi, '') // "Fulana at https://flickr.com/..." → "Fulana"
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

/** Borra de web/ las versiones que ya no usa ninguna pregunta. */
export function pruneImages(used) {
  if (!existsSync(IMAGES_WEB_DIR)) return [];
  const removed = readdirSync(IMAGES_WEB_DIR).filter((f) => !used.has(f));
  for (const f of removed) unlinkSync(path.join(IMAGES_WEB_DIR, f));
  return removed;
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
