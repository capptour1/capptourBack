-- ============================================================
-- Migración: Social Login (Google + Apple)
-- Ejecutar una sola vez contra la base de datos de producción
-- ============================================================

-- 1. Hacer password nullable para usuarios de social login
ALTER TABLE auth.usuarios
  ALTER COLUMN password DROP NOT NULL;

-- 2. Columna que identifica el proveedor de autenticación
ALTER TABLE auth.usuarios
  ADD COLUMN IF NOT EXISTS proveedor_auth VARCHAR(20) NOT NULL DEFAULT 'local';
-- Valores posibles: 'local' | 'google' | 'apple'

-- 3. ID único del usuario en el proveedor (el "sub" del JWT del proveedor)
ALTER TABLE auth.usuarios
  ADD COLUMN IF NOT EXISTS proveedor_id VARCHAR(255) DEFAULT NULL;

-- 4. Índice único para evitar duplicados por proveedor
--    (un mismo sub de Google/Apple no puede estar vinculado a dos cuentas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_proveedor
  ON auth.usuarios (proveedor_auth, proveedor_id)
  WHERE proveedor_id IS NOT NULL;

-- ============================================================
-- Verificación (opcional, ejecutar para confirmar)
-- ============================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'auth' AND table_name = 'usuarios'
-- ORDER BY ordinal_position;
