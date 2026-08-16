-- ═══════════════════════════════════════════════════════════════════════════════
-- Migración: Timestamps de ocultamiento de conversación
-- Fecha: 2026-08-15
-- Descripción: Agrega fecha de ocultamiento por participante para filtrar
--              historial visible después de "eliminar chat".
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE chat.conversacion ADD COLUMN IF NOT EXISTS fecha_oculto_cliente TIMESTAMPTZ;
ALTER TABLE chat.conversacion ADD COLUMN IF NOT EXISTS fecha_oculto_fotografo TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='chat' AND table_name='conversacion'
--   ORDER BY ordinal_position;
--   → debe incluir fecha_oculto_cliente y fecha_oculto_fotografo
--
-- ROLLBACK:
--   ALTER TABLE chat.conversacion DROP COLUMN IF EXISTS fecha_oculto_cliente;
--   ALTER TABLE chat.conversacion DROP COLUMN IF EXISTS fecha_oculto_fotografo;
-- ═══════════════════════════════════════════════════════════════════════════════
