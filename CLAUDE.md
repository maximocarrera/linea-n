# Línea N — notas para Claude

## Diseño de UI
- Para cualquier trabajo visual (pantallas, componentes, animaciones) usar la skill del proyecto `ui-ux-pro-max` (`.claude/skills/ui-ux-pro-max/`). Verificar que lo que devuelve encaje con un juego de trivia con estética de subte antes de aplicarlo.
- MCP `21st` (Magic de 21st.dev, en `.mcp.json`): usarlo para buscar o generar componentes cuando esté conectado. Lo generado se adapta a los tokens de `client/src/index.css`, no se pega tal cual.
- Dirección visual: brutalismo de cartelería de subte, oscuro, con amarillo de señal (`signal`), Space Grotesk y JetBrains Mono para números y códigos.
- Reglas: íconos SVG de `lucide-react` (sin emojis como íconos), botones táctiles de 48px o más, texto con contraste de 4.5:1 o más (para texto secundario usar `text-mute`, no `chalk/40`), animar solo `transform`/`opacity` y respetar `prefers-reduced-motion`.

## Datos
- Las preguntas viven en SQLite (`server/data/linean.db`). Nunca volver a hardcodearlas en `shared`.
- La fuente de verdad de cada pregunta es su archivo `server/data/preguntas/*.txt` (columna `questions.source`). Se cargan con `npm run db:import`. Editar en la base una pregunta que tiene archivo se pierde en el próximo import.
- La normalización y la tolerancia a typos (`shared/src/normalize.js`, `matchAnswer` en `scoring.js`) no se tocan sin pedido explícito.

## Cómo armar preguntas nuevas (borradores)
Las preguntas nuevas que arma Claude van a `server/data/preguntas-borrador/`, nunca directo a `preguntas/`. El juego no lee esa carpeta: el dueño las revisa y mueve las que aprueba.

**Prohibido en esta tarea:** tocar `server/data/preguntas/`, el código, la base, o hacer commit/push. No correr `npm run db:import`.

**Antes de arrancar**
- Mirar qué existe: `ls server/data/preguntas server/data/preguntas-borrador` y `grep -h "^consigna" server/data/preguntas/*.txt`. No repetir temas (ni con otra redacción).
- Ver 2 o 3 archivos existentes como modelo (p. ej. `peliculas-adam-sandler.txt`, `canciones_de_tini.txt`, `top-100-artistas-spotify.txt`).

**Formato de cada archivo** (`nombre-en-minusculas-sin-tildes.txt`, una pregunta por archivo)
```
# Comentario: de dónde sale la lista y cualquier aclaración (fecha si es un dato que cambia).
categoria: Música
consigna: Nombrá una canción de Soda Stereo
activa: si
apellidos: no

[10]
De música ligera
Persiana americana

[30]
...
```
- `categoria`: usar una existente: Cine, Fútbol, Música, Argentina, Comida, Mundo, General, Deportes, Animales, Televisión, Ropa, Belleza y Cuidado Personal, Streaming, Ciencia, Videojuegos, Arte, Naturaleza, Idiomas. Siempre con tildes.
- `consigna`: en voseo y con tildes ("Nombrá…"). Corta y sin ambigüedad sobre qué vale.
- `apellidos: si` solo cuando las respuestas son personas (así "Messi" vale por "Lionel Messi"); si no, `no`.
- Niveles: `[10]` lo que diría casi todos · `[30]` conocido · `[60]` hay que saber · `[100]` de nicho. Pocas de 10 (5 a 12), el grueso en 30 y 60. Para rankings (top 100, etc.): 10 grupos por puesto, 10 a 100 puntos.
- Variantes con `|`: título en Argentina | original | España, forma corta, sin "The"/"Los", números en letras ("Volver a los 17 | Volver a los diecisiete"), apodos conocidos.
- Cantidad: entre 20 y 150 respuestas. Si un tema da menos de 15, no sirve.
- Evitar: respuestas repetidas, respuestas de una palabra común que se aciertan al azar, datos posteriores a lo que se sabe con seguridad, y listas "completas" inventadas. Ante la duda sobre un dato, no ponerlo.
- Público: argentino. Priorizar lo que se conoce en Argentina; mezclar temas locales y globales.
- Fotos: opcionales, solo para preguntas sobre una persona. `imagen:` con un link de Wikimedia Commons que tenga `File:`. No descargar nada.

**Después de cada archivo:** `npm run db:borradores` y corregir todo lo marcado con ✖. Los avisos ⚠ de apellidos compartidos son normales.

**Al final (o cada 10 preguntas):** actualizar `server/data/preguntas-borrador/REVISAR.md` con una línea por pregunta: archivo, consigna, cantidad de respuestas y dudas concretas ("no estoy seguro de que X sea argentino").
