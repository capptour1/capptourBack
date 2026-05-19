-- ============================================================
-- Migración: Sistema de Notificaciones
-- Ejecutar una sola vez contra la base de datos de producción
-- ============================================================

CREATE SCHEMA IF NOT EXISTS notif;

-- Tabla principal de notificaciones
CREATE TABLE IF NOT EXISTS notif.notificaciones (
  id              SERIAL PRIMARY KEY,
  id_usuario      INT NOT NULL REFERENCES auth.usuarios(id) ON DELETE CASCADE,

  -- Tipo semántico: 'message' | 'session' | 'booking' | 'rating' | 'system' | 'promo'
  tipo            VARCHAR(30) NOT NULL DEFAULT 'system',

  titulo          VARCHAR(150) NOT NULL,
  mensaje         TEXT NOT NULL,

  -- Datos extra para navegación en el cliente (JSON libre)
  -- Ej: {"route": "chatScreen", "conversationId": 42}
  -- Ej: {"route": "infoSessionPhotographer", "sessionId": 7}
  payload         JSONB DEFAULT NULL,

  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  fec_creacion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fec_lectura     TIMESTAMPTZ DEFAULT NULL
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_notif_usuario     ON notif.notificaciones (id_usuario);
CREATE INDEX IF NOT EXISTS idx_notif_no_leidas   ON notif.notificaciones (id_usuario, leida) WHERE leida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_fecha       ON notif.notificaciones (id_usuario, fec_creacion DESC);

-- ============================================================
-- Verificación (opcional)
-- ============================================================
-- SELECT * FROM notif.notificaciones LIMIT 5;
