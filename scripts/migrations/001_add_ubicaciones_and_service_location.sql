-- ============================================================
-- Migración: Servicios por ubicación
-- ============================================================

-- 1. Crear schema si no existe
CREATE SCHEMA IF NOT EXISTS catalogo;

-- 2. Tabla de ubicaciones (catálogo de ciudades/países)
CREATE TABLE IF NOT EXISTS catalogo.ubicaciones (
    id_ubicacion bigserial PRIMARY KEY,
    ciudad varchar(100) NOT NULL,
    estado varchar(100),
    pais varchar(100) NOT NULL,
    codigo_pais char(2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    fec_creacion timestamptz DEFAULT now() NOT NULL
);

-- 3. Agregar columna id_ubicacion a servicios (nullable para backward-compatibility)
ALTER TABLE fotografo.servicios 
    ADD COLUMN IF NOT EXISTS id_ubicacion bigint REFERENCES catalogo.ubicaciones(id_ubicacion);

-- 4. Índice para búsqueda por ubicación
CREATE INDEX IF NOT EXISTS idx_servicios_ubicacion 
    ON fotografo.servicios(id_ubicacion) 
    WHERE id_ubicacion IS NOT NULL;

-- 5. Datos iniciales de ejemplo (ajustar según necesidad)
INSERT INTO catalogo.ubicaciones (ciudad, estado, pais, codigo_pais) VALUES
    ('Bogotá', 'Cundinamarca', 'Colombia', 'CO'),
    ('Medellín', 'Antioquia', 'Colombia', 'CO'),
    ('Lima', 'Lima', 'Perú', 'PE'),
    ('Ciudad de México', 'CDMX', 'México', 'MX'),
    ('Buenos Aires', 'Buenos Aires', 'Argentina', 'AR')
ON CONFLICT DO NOTHING;
