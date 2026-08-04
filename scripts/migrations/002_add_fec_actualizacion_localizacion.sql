-- ============================================================
-- Migración: Timestamp de última actualización en localizacion
-- ============================================================

ALTER TABLE fotografo.localizacion 
    ADD COLUMN IF NOT EXISTS fec_actualizacion timestamptz DEFAULT now();

-- Índice para filtrar fotógrafos con ubicación reciente (opcional, mejora búsqueda)
CREATE INDEX IF NOT EXISTS idx_localizacion_actualizacion 
    ON fotografo.localizacion(fec_actualizacion DESC);
