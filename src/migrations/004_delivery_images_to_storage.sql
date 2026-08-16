-- ═══════════════════════════════════════════════════════════════════════════════
-- Migración: Agregar columnas de ruta a imagenes_entrega
-- Fecha: 2026-08-16
-- Descripción: Agrega columnas url_imagen y url_thumbnail para almacenar
--              rutas relativas. Las columnas BYTEA se conservan hasta que
--              la migración de datos se complete.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE reserva.imagenes_entrega ADD COLUMN IF NOT EXISTS url_imagen VARCHAR(500);
ALTER TABLE reserva.imagenes_entrega ADD COLUMN IF NOT EXISTS url_thumbnail VARCHAR(500);
ALTER TABLE reserva.imagenes_entrega ADD COLUMN IF NOT EXISTS nombre VARCHAR(200);
ALTER TABLE reserva.imagenes_entrega ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE reserva.imagenes_entrega ADD COLUMN IF NOT EXISTS tamano BIGINT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='reserva' AND table_name='imagenes_entrega';
--   → debe incluir url_imagen, url_thumbnail, nombre, mime_type, tamano
--
-- ROLLBACK:
--   ALTER TABLE reserva.imagenes_entrega DROP COLUMN IF EXISTS url_imagen;
--   ALTER TABLE reserva.imagenes_entrega DROP COLUMN IF EXISTS url_thumbnail;
--   ALTER TABLE reserva.imagenes_entrega DROP COLUMN IF EXISTS nombre;
--   ALTER TABLE reserva.imagenes_entrega DROP COLUMN IF EXISTS mime_type;
--   ALTER TABLE reserva.imagenes_entrega DROP COLUMN IF EXISTS tamano;
-- ═══════════════════════════════════════════════════════════════════════════════
