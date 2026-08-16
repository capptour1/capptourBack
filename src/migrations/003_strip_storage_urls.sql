-- ═══════════════════════════════════════════════════════════════════════════════
-- Migración: Convertir URLs absolutas a rutas relativas en chat.adjuntos
-- Fecha: 2026-08-15
-- Descripción: Elimina el prefijo de STORAGE_BASE_URL de las columnas url y
--              url_thumbnail, dejando solo la ruta relativa.
--              Idempotente: solo modifica registros que aún contengan 'http'.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Convertir url: http://host/storage/chat/images/... → chat/images/...
UPDATE chat.adjuntos
SET url = regexp_replace(url, '^https?://[^/]+/storage/', '')
WHERE url LIKE 'http%';

-- Convertir url_thumbnail
UPDATE chat.adjuntos
SET url_thumbnail = regexp_replace(url_thumbnail, '^https?://[^/]+/storage/', '')
WHERE url_thumbnail LIKE 'http%';

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN:
--   SELECT url, url_thumbnail FROM chat.adjuntos;
--   → Ninguna fila debe comenzar con 'http'
--
-- ROLLBACK (requiere conocer la STORAGE_BASE_URL original):
--   UPDATE chat.adjuntos
--   SET url = 'http://192.168.80.11:3000/storage/' || url
--   WHERE url NOT LIKE 'http%';
--
--   UPDATE chat.adjuntos
--   SET url_thumbnail = 'http://192.168.80.11:3000/storage/' || url_thumbnail
--   WHERE url_thumbnail IS NOT NULL AND url_thumbnail NOT LIKE 'http%';
-- ═══════════════════════════════════════════════════════════════════════════════
