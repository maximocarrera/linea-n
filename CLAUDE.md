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
