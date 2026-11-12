-- Línea N · esquema de preguntas
-- Pensado para editarse a mano desde DB Browser for SQLite, TablePlus, DBeaver, etc.

-- Una fila por pregunta. Para sacarla de juego sin borrarla: active = 0.
CREATE TABLE IF NOT EXISTS questions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  category  TEXT    NOT NULL,                       -- "Geografía", "Subte"...
  prompt    TEXT    NOT NULL UNIQUE,                -- "Nombrá un país que empiece con B"
  active    INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  source    TEXT                                    -- archivo de server/data/preguntas/ que la define (o NULL)
);

-- Una fila por respuesta válida.
--   answer  : respuesta principal (la que se muestra), ej. "Benín"
--   aliases : variantes separadas por | , ej. "Benin|Dahomey" (puede quedar vacío)
--   points  : 10 común · 30 poco común · 60 rara · 100 de nicho (cualquier entero > 0)
-- No hace falta cargar variantes con/sin tilde ni mayúsculas: el juego ya las normaliza
-- y tolera errores de tipeo chicos.
CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer      TEXT    NOT NULL,
  aliases     TEXT,
  points      INTEGER NOT NULL CHECK (points > 0),
  UNIQUE (question_id, answer)
);

CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(active);

-- Vista de control: cuántas respuestas tiene cada pregunta y cómo se reparten por rareza.
CREATE VIEW IF NOT EXISTS question_overview AS
SELECT
  q.id,
  q.category,
  q.prompt,
  q.active,
  COUNT(a.id)                                 AS total_answers,
  COALESCE(SUM(a.points <= 10), 0)            AS comunes,
  COALESCE(SUM(a.points > 10 AND a.points <= 30), 0) AS poco_comunes,
  COALESCE(SUM(a.points > 30 AND a.points <= 60), 0) AS raras,
  COALESCE(SUM(a.points > 60), 0)             AS de_nicho
FROM questions q
LEFT JOIN answers a ON a.question_id = q.id
GROUP BY q.id;
