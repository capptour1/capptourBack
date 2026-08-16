-- ═══════════════════════════════════════════════════════════════════════════════
-- Migración: Agregar columnas de ruta a imagen_servicio
-- Fecha: 2026-08-16
-- Descripción: Agrega columnas para almacenar rutas relativas en vez de BYTEA.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE fotografo.imagen_servicio ADD COLUMN IF NOT EXISTS url_imagen VARCHAR(500);
ALTER TABLE fotografo.imagen_servicio ADD COLUMN IF NOT EXISTS url_thumbnail VARCHAR(500);
ALTER TABLE fotografo.imagen_servicio ADD COLUMN IF NOT EXISTS nombre VARCHAR(200);
ALTER TABLE fotografo.imagen_servicio ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE fotografo.imagen_servicio ADD COLUMN IF NOT EXISTS tamano BIGINT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='fotografo' AND table_name='imagen_servicio';
--
-- ROLLBACK:
--   ALTER TABLE fotografo.imagen_servicio DROP COLUMN IF EXISTS url_imagen;
--   ALTER TABLE fotografo.imagen_servicio DROP COLUMN IF EXISTS url_thumbnail;
--   ALTER TABLE fotografo.imagen_servicio DROP COLUMN IF EXISTS nombre;
--   ALTER TABLE fotografo.imagen_servicio DROP COLUMN IF EXISTS mime_type;
--   ALTER TABLE fotografo.imagen_servicio DROP COLUMN IF EXISTS tamano;
-- ═══════════════════════════════════════════════════════════════════════════════
