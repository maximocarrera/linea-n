// Páginas de contenido en HTML plano (sin JavaScript): cómo jugar, catálogo de preguntas,
// acerca de y privacidad. Existen para que buscadores y revisores (Google AdSense) vean
// contenido real del sitio: la app del juego es una SPA cuyo HTML inicial está vacío.
import { QUESTIONS_PER_GAME, ROUND_SECONDS, MAX_PLAYERS, SOLO_TARGET, TERMINAL_STATION } from '@linean/shared';

const SITE = 'https://lineanicho.com';
const ADSENSE_CLIENT = 'ca-pub-3032830759957402';
const CAFECITO = 'https://cafecito.app/lineanicho';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const slugify = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const TIER_LABEL = (p) => (p >= 100 ? 'de nicho' : p >= 60 ? 'rara' : p >= 30 ? 'poco común' : 'común');

const CSS = `
:root{--tunnel:#0b0d12;--platform:#151a24;--sign:#0f1219;--chalk:#f4f2ea;--mute:#aeaca4;--rail:#2a3140;--signal:#ffd400}
*{box-sizing:border-box}
html{color-scheme:dark}
body{margin:0;background:var(--tunnel);color:var(--chalk);font:16px/1.6 "Space Grotesk",system-ui,sans-serif}
a{color:var(--signal)}
a:focus-visible{outline:3px solid var(--signal);outline-offset:2px}
.strip{height:8px;background:repeating-linear-gradient(-45deg,var(--signal) 0 14px,#111 14px 28px)}
header.top{border-bottom:2px solid var(--rail);background:var(--sign)}
.wrap{max-width:860px;margin:0 auto;padding:0 16px}
nav{display:flex;flex-wrap:wrap;gap:4px 18px;align-items:center;padding:14px 0}
nav .brand{font-weight:700;font-size:20px;color:var(--chalk);text-decoration:none;margin-right:auto;letter-spacing:-.02em}
nav .brand b{background:var(--signal);color:var(--tunnel);padding:0 8px;margin-right:6px}
nav a{min-height:44px;display:inline-flex;align-items:center;text-decoration:none;font-weight:600}
nav a:hover{text-decoration:underline}
main{padding:32px 0 48px}
h1{font-size:clamp(28px,6vw,44px);line-height:1.1;letter-spacing:-.02em;margin:0 0 12px;text-transform:uppercase}
h2{font-size:22px;margin:36px 0 10px;text-transform:uppercase;letter-spacing:-.01em}
h3{font-size:18px;margin:0 0 6px}
p,li{color:var(--chalk)}
.lead{font-size:18px;color:var(--mute);max-width:62ch}
.mute{color:var(--mute)}
.cta{display:inline-flex;align-items:center;min-height:52px;padding:0 24px;background:var(--signal);color:var(--tunnel);font-weight:700;text-transform:uppercase;text-decoration:none;box-shadow:5px 5px 0 #000;margin-top:16px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));padding:0;list-style:none}
.card{border:2px solid var(--rail);background:var(--platform);padding:16px}
.card a{text-decoration:none}
.q{border-left:4px solid var(--signal);background:var(--platform);padding:14px 16px;margin:12px 0}
.q p{margin:4px 0 0}
.mono{font-family:"JetBrains Mono",ui-monospace,monospace}
.tag{display:inline-block;border:1px solid var(--rail);padding:0 8px;margin:4px 6px 0 0;font-size:14px}
footer{border-top:2px solid var(--rail);padding:24px 0 40px;color:var(--mute);font-size:14px}
footer a{color:var(--mute)}
@media (max-width:560px){nav{gap:0 16px}nav .brand{width:100%;min-height:44px}main{padding-top:24px}}
`;

function layout({ title, description, path, body }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Línea N</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta name="theme-color" content="#0b0d12">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-KB2QLK3XWS"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-KB2QLK3XWS');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>
</head>
<body>
<div class="strip" aria-hidden="true"></div>
<header class="top"><div class="wrap"><nav aria-label="Principal">
<a class="brand" href="/"><b>N</b>Línea N</a>
<a href="/como-jugar">Cómo jugar</a>
<a href="/preguntas">Preguntas</a>
<a href="/acerca">Acerca de</a>
</nav></div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">
<p>Línea N · trivia de respuestas raras. <a href="/">Jugar</a> · <a href="/como-jugar">Cómo jugar</a> · <a href="/preguntas">Preguntas</a> · <a href="/acerca">Acerca de</a> · <a href="/privacidad">Privacidad</a></p>
</div></footer>
</body>
</html>`;
}

/** Catálogo de preguntas activas, con ejemplos de respuestas. Cacheado unos minutos. */
export class Catalog {
  constructor(db, ttlMs = 10 * 60_000) {
    this.db = db;
    this.ttlMs = ttlMs;
    this.cached = null;
  }

  get() {
    if (this.cached && Date.now() - this.cached.at < this.ttlMs) return this.cached.data;
    const questions = this.db
      .prepare(
        `SELECT q.id, q.category, q.prompt, COUNT(a.id) AS total
         FROM questions q JOIN answers a ON a.question_id = q.id
         WHERE q.active = 1 GROUP BY q.id ORDER BY q.category COLLATE NOCASE, q.prompt COLLATE NOCASE`,
      )
      .all();
    const common = this.db.prepare(
      `SELECT answer, points FROM answers WHERE question_id = ? ORDER BY points ASC, id ASC LIMIT 5`,
    );
    const rare = this.db.prepare(
      `SELECT answer, points FROM answers WHERE question_id = ? AND points >= 60 ORDER BY id ASC LIMIT 2`,
    );
    const categories = new Map();
    for (const q of questions) {
      const examples = [...common.all(q.id), ...rare.all(q.id)];
      const seen = new Set();
      const item = {
        id: q.id,
        prompt: q.prompt,
        total: q.total,
        examples: examples.filter((e) => !seen.has(e.answer) && seen.add(e.answer)),
      };
      const slug = slugify(q.category);
      if (!categories.has(slug)) categories.set(slug, { slug, name: q.category, questions: [] });
      const cat = categories.get(slug);
      // "Futbol" y "Fútbol" son la misma categoría: se muestra la versión con tildes.
      if (/[^\x00-\x7f]/.test(q.category) && !/[^\x00-\x7f]/.test(cat.name)) cat.name = q.category;
      cat.questions.push(item);
    }
    const data = {
      categories: [...categories.values()],
      questions: questions.length,
      answers: questions.reduce((n, q) => n + q.total, 0),
    };
    this.cached = { at: Date.now(), data };
    return data;
  }
}

const fmt = (n) => n.toLocaleString('es-AR');

export function comoJugarPage() {
  return layout({
    title: 'Cómo jugar',
    description: 'Reglas de Línea N: una trivia donde cuanto más rara es tu respuesta, más puntos sumás.',
    path: '/como-jugar',
    body: `
<h1>Cómo jugar</h1>
<p class="lead">Línea N es una trivia al revés: no gana el que responde lo más obvio, sino el que encuentra la respuesta correcta que menos gente diría.</p>

<h2>La idea</h2>
<p>Cada pregunta tiene muchas respuestas válidas. Por ejemplo, si la consigna es <em>"Nombrá un país de Europa"</em>, decir <strong>España</strong> está bien, pero vale poco porque es lo primero que se le ocurre a todo el mundo. Decir <strong>Liechtenstein</strong> también está bien y vale mucho más.</p>

<h2>Los puntos</h2>
<p>Cada respuesta válida tiene un nivel de rareza:</p>
<ul>
<li><strong>Común</strong>: 10 puntos. Lo que diría casi cualquiera.</li>
<li><strong>Poco común</strong>: 30 puntos. Hay que pensarlo un poco.</li>
<li><strong>Rara</strong>: 60 puntos. Pocos la conocen.</li>
<li><strong>De nicho</strong>: 100 puntos. Solo para fanáticos del tema.</li>
</ul>
<p>Una respuesta que no está en la lista no suma. No hace falta escribir con tildes ni mayúsculas, y los errores de tipeo chicos se perdonan.</p>

<h2>Una partida</h2>
<p>Cada viaje tiene <strong>${QUESTIONS_PER_GAME} estaciones</strong> (preguntas). En cada una tenés <strong>${ROUND_SECONDS} segundos</strong> para escribir una respuesta. Las estaciones salen de categorías muy distintas: geografía, fútbol, música, cine, televisión, comida, animales, cuerpo humano y mucho más.</p>

<h2>Modo solo</h2>
<p>Jugás contra el reloj. La meta es llegar a <strong>${SOLO_TARGET} puntos</strong> y alcanzar la cabecera, ${esc(TERMINAL_STATION)}. Al final ves qué porcentaje de la gente eligió cada una de tus respuestas.</p>

<h2>Con amigos</h2>
<p>Creás una sala, compartís el código y se suman hasta <strong>${MAX_PLAYERS} pasajeros</strong> desde sus celulares. Todos responden la misma pregunta al mismo tiempo y gana quien acumula más puntos. Si dos jugadores dan la misma respuesta, los dos suman.</p>

<h2>Consejos</h2>
<ul>
<li>Pensá en lo que nadie diría, pero que sabés que es correcto.</li>
<li>Si dudás entre dos respuestas, elegí la menos famosa.</li>
<li>Mirá las estadísticas del final: te muestran qué contesta la mayoría.</li>
</ul>

<a class="cta" href="/">Subir al tren</a>
`,
  });
}

export function preguntasPage(catalog) {
  const { categories, questions, answers } = catalog;
  return layout({
    title: 'Todas las preguntas',
    description: `Catálogo de las ${questions} preguntas de Línea N, con ${fmt(answers)} respuestas válidas en ${categories.length} categorías.`,
    path: '/preguntas',
    body: `
<h1>Las preguntas</h1>
<p class="lead">Línea N tiene <strong>${questions} preguntas</strong> con <span class="mono">${fmt(answers)}</span> respuestas válidas, repartidas en ${categories.length} categorías. Elegí una para ver sus consignas y algunas respuestas de ejemplo.</p>
<ul class="grid">
${categories
  .map(
    (c) => `<li class="card"><h3><a href="/preguntas/${c.slug}">${esc(c.name)}</a></h3>
<p class="mute">${c.questions.length} ${c.questions.length === 1 ? 'pregunta' : 'preguntas'} · ${fmt(c.questions.reduce((n, q) => n + q.total, 0))} respuestas</p></li>`,
  )
  .join('\n')}
</ul>
<a class="cta" href="/">Jugar ahora</a>
`,
  });
}

export function categoriaPage(category) {
  return layout({
    title: `Preguntas de ${category.name}`,
    description: `Preguntas de ${category.name} en Línea N: ${category.questions.map((q) => q.prompt).slice(0, 3).join(' · ')}.`,
    path: `/preguntas/${category.slug}`,
    body: `
<p class="mute"><a href="/preguntas">← Todas las categorías</a></p>
<h1>${esc(category.name)}</h1>
<p class="lead">${category.questions.length} ${category.questions.length === 1 ? 'pregunta' : 'preguntas'} de esta categoría. Abajo de cada una van algunas respuestas válidas de ejemplo: las comunes valen poco, las de nicho valen mucho.</p>
${category.questions
  .map(
    (q) => `<section class="q">
<h3>${esc(q.prompt)}</h3>
<p class="mute">${fmt(q.total)} respuestas válidas.</p>
<p>${q.examples.map((e) => `<span class="tag">${esc(e.answer)} <span class="mute">· ${TIER_LABEL(e.points)}</span></span>`).join('')}${q.total > q.examples.length ? ` <span class="mute">y ${fmt(q.total - q.examples.length)} más.</span>` : ''}</p>
</section>`,
  )
  .join('\n')}
<a class="cta" href="/">Jugar ahora</a>
`,
  });
}

export function acercaPage(catalog) {
  return layout({
    title: 'Acerca de',
    description: 'Qué es Línea N, quién lo hace y cómo se arman las preguntas.',
    path: '/acerca',
    body: `
<h1>Acerca de Línea N</h1>
<p class="lead">Línea N es un juego de trivia argentino, gratuito y sin registro, inspirado en la estética de la cartelería del subte de Buenos Aires.</p>

<h2>Qué tiene de distinto</h2>
<p>En la mayoría de las trivias gana quien sabe la respuesta. En Línea N casi todas las preguntas tienen decenas o cientos de respuestas correctas, y lo que importa es cuán original es la tuya. Hoy el juego tiene ${catalog.questions} preguntas y más de ${fmt(Math.floor(catalog.answers / 100) * 100)} respuestas válidas.</p>

<h2>Cómo se arman las preguntas</h2>
<p>Cada pregunta se arma a mano, con la lista más completa posible de respuestas correctas, y cada respuesta se clasifica según qué tan conocida es. Las listas que dependen de la actualidad (planteles de fútbol, festivales, premios) se revisan con fuentes periodísticas y se actualizan cuando cambian.</p>
<p>Los porcentajes que se ven al final de cada partida ("el 30% de la gente eligió esta respuesta") son reales: salen de las respuestas de todos los que jugaron.</p>

<h2>Sugerencias y contacto</h2>
<p>Si encontrás una respuesta correcta que el juego no aceptó, o se te ocurre una pregunta nueva, dejala en el <a href="/">buzón de sugerencias</a> de la portada o al final de cada partida. Leemos todas.</p>

<h2>Bancar el proyecto</h2>
<p>Línea N es un proyecto independiente. Si te gusta, podés invitarnos un <a href="${CAFECITO}" rel="noopener noreferrer">cafecito</a>: ayuda a pagar el servidor y a sumar preguntas nuevas.</p>

<p class="mute">Ver también: <a href="/privacidad">política de privacidad</a>.</p>
`,
  });
}

export function privacidadPage() {
  return layout({
    title: 'Política de privacidad',
    description: 'Qué datos usa Línea N, cookies y publicidad de Google.',
    path: '/privacidad',
    body: `
<h1>Política de privacidad</h1>
<p class="mute">Última actualización: noviembre de 2026.</p>

<h2>Qué datos guardamos</h2>
<ul>
<li><strong>No hay cuentas ni registro.</strong> No pedimos nombre real, email ni teléfono.</li>
<li>En las partidas con amigos elegís un apodo, que solo ven los demás jugadores de la sala y no se guarda al terminar.</li>
<li>Guardamos las respuestas de las partidas de forma anónima (sin datos de quién las dio) para calcular qué porcentaje de la gente eligió cada respuesta.</li>
<li>Si mandás una sugerencia, guardamos solo el texto que escribiste.</li>
<li>Tu navegador guarda en almacenamiento local qué preguntas jugaste hace poco, para no repetirlas. Podés borrarlo cuando quieras desde la configuración del navegador.</li>
</ul>

<h2>Publicidad y cookies de terceros</h2>
<p>Este sitio puede mostrar anuncios de Google AdSense. Google y sus socios usan cookies para mostrar anuncios según las visitas anteriores del usuario a este sitio y a otros sitios de Internet.</p>
<ul>
<li>Google usa cookies de publicidad para que él y sus socios puedan mostrar anuncios basados en tus visitas a este y otros sitios.</li>
<li>Podés desactivar la publicidad personalizada en la <a href="https://adssettings.google.com" rel="noopener noreferrer">configuración de anuncios de Google</a>.</li>
<li>También podés desactivar las cookies de otros proveedores de publicidad en <a href="https://www.aboutads.info/choices" rel="noopener noreferrer">aboutads.info</a>.</li>
<li>Más información sobre cómo Google usa los datos: <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">policies.google.com/technologies/partner-sites</a>.</li>
</ul>

<h2>Estadísticas de uso</h2>
<p>Usamos Google Analytics para saber cuánta gente visita el sitio y juega (por ejemplo, cuántas partidas se empiezan y se terminan, desde qué país y con qué tipo de dispositivo). Google Analytics usa cookies y no recibe tu nombre ni tus respuestas. Podés bloquearlo con el <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener noreferrer">complemento de inhabilitación de Google Analytics</a> o desde la configuración de tu navegador.</p>

<h2>Registros técnicos</h2>
<p>Como cualquier servidor web, el nuestro procesa la dirección IP de cada pedido. La usamos solo en memoria para limitar el spam (por ejemplo, cuántas sugerencias se mandan por minuto) y no la guardamos asociada a tus respuestas.</p>

<h2>Contacto</h2>
<p>Para cualquier consulta sobre privacidad, escribinos desde el <a href="/">buzón de sugerencias</a> de la portada.</p>
`,
  });
}

export function robotsTxt() {
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`;
}

export function sitemapXml(catalog) {
  const urls = ['/', '/como-jugar', '/preguntas', '/acerca', '/privacidad', ...catalog.categories.map((c) => `/preguntas/${c.slug}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
}
