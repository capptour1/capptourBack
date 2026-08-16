-- ═══════════════════════════════════════════════════════════════════════════════
-- Migración: Evolución del módulo Chat
-- Fecha: 2026-08-15
-- Descripción: Agrega soporte para tipos de mensaje, adjuntos, soft-delete
--              y corrige tipo de fec_lectura.
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PRECONDICIONES:
--   - Backup completo de chat.conversacion y chat.mensajes realizado
--   - SELECT COUNT(*) FROM chat.mensajes → documentar resultado
--   - SELECT COUNT(*) FROM chat.conversacion → documentar resultado
--
-- ROLLBACK (en caso de fallo):
--   DROP TABLE IF EXISTS chat.adjuntos;
--   ALTER TABLE chat.conversacion DROP COLUMN IF EXISTS oculto_cliente;
--   ALTER TABLE chat.conversacion DROP COLUMN IF EXISTS oculto_fotografo;
--   ALTER TABLE chat.mensajes DROP COLUMN IF EXISTS tipo;
--   ALTER TABLE chat.mensajes DROP COLUMN IF EXISTS eliminado;
--   ALTER TABLE chat.mensajes ALTER COLUMN contenido SET NOT NULL;
--   ALTER TABLE chat.mensajes ALTER COLUMN fec_lectura TYPE VARCHAR;
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── CONVERSACIONES ──────────────────────────────────────────────────────────

ALTER TABLE chat.conversacion ADD COLUMN IF NOT EXISTS oculto_cliente BOOLEAN DEFAULT FALSE;
ALTER TABLE chat.conversacion ADD COLUMN IF NOT EXISTS oculto_fotografo BOOLEAN DEFAULT FALSE;

-- ─── MENSAJES ────────────────────────────────────────────────────────────────

-- Permitir mensajes sin texto (ej: solo imagen)
ALTER TABLE chat.mensajes ALTER COLUMN contenido DROP NOT NULL;

-- Tipo de mensaje: 'text', 'image', 'video', 'audio', 'document', 'system'
ALTER TABLE chat.mensajes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'text';

-- Eliminación lógica
ALTER TABLE chat.mensajes ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE;

-- Corregir fec_lectura de varchar a timestamptz
ALTER TABLE chat.mensajes ALTER COLUMN fec_lectura TYPE TIMESTAMPTZ
  USING CASE WHEN fec_lectura IS NOT NULL AND fec_lectura != ''
    THEN fec_lectura::timestamptz ELSE NULL END;

-- ─── ADJUNTOS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat.adjuntos (
  id_adjunto    BIGSERIAL PRIMARY KEY,
  id_mensaje    BIGINT NOT NULL REFERENCES chat.mensajes(id_mensaje) ON DELETE CASCADE,
  url           VARCHAR(500) NOT NULL,
  url_thumbnail VARCHAR(500),
  nombre        VARCHAR(200),
  mime_type     VARCHAR(100) NOT NULL,
  tamano        BIGINT,
  fec_creacion  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────

-- Paginación de mensajes por conversación
CREATE INDEX IF NOT EXISTS idx_mensajes_conv_fecha
  ON chat.mensajes(id_conversacion, fec_creacion DESC);

-- Contar no leídos (excluye eliminados)
CREATE INDEX IF NOT EXISTS idx_mensajes_no_leidos
  ON chat.mensajes(id_conversacion, fec_lectura)
  WHERE fec_lectura IS NULL AND eliminado = FALSE;

-- Buscar adjuntos por mensaje
CREATE INDEX IF NOT EXISTS idx_adjuntos_mensaje
  ON chat.adjuntos(id_mensaje);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIONES POST-MIGRACIÓN:
--   SELECT COUNT(*) FROM chat.mensajes → debe ser igual al valor pre-migración
--   SELECT DISTINCT tipo FROM chat.mensajes → debe ser solo 'text'
--   SELECT COUNT(*) FROM chat.mensajes WHERE eliminado = TRUE → debe ser 0
--   SELECT COUNT(*) FROM chat.conversacion WHERE oculto_cliente = TRUE → debe ser 0
--   SELECT COUNT(*) FROM chat.adjuntos → debe ser 0
--   Ejecutar query de chat list existente → debe funcionar sin errores
-- ═══════════════════════════════════════════════════════════════════════════════
