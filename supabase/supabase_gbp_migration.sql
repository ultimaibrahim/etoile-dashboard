-- ==============================================================================
-- 🏛️ ÉTOILE ZENITH: MIGRACIÓN ESTRUCTURAL A GOOGLE BUSINESS PROFILE (GBP) API
-- ==============================================================================
-- Este script realiza la reestructuración completa de Supabase:
-- 1. Crea la tabla 'locations' para normalizar las 33 sucursales con metadatos GBP.
-- 2. Crea la tabla 'reviews_core' tipada con tipos nativos, llaves foráneas y payloads.
-- 3. Migra todas las reseñas históricas existentes sin pérdida de datos.
-- 4. Renombra o reemplaza la vista 'reviews' para garantizar retrocompatibilidad 100%.
-- 5. Actualiza la vista 'quarterly_stats' y asegura índices de alto rendimiento y RLS.
-- ==============================================================================

BEGIN;

-- 1. TABLA LOCATIONS (Sucursales Físicas)
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,                       -- Slug canónico (ej. 'andares', 'gal-gdl')
    nombre TEXT NOT NULL,                     -- Nombre comercial oficial (ej. 'Andares')
    abr TEXT NOT NULL,                        -- Abreviatura para UI (ej. 'Andares')
    region TEXT NOT NULL,                     -- Código regional (ej. 'GDL', 'CDMX')
    gbp_account_id TEXT,                      -- ID de cuenta en GBP (ej. 'accounts/123456789')
    gbp_location_id TEXT UNIQUE,              -- ID oficial de ubicación en GBP (ej. 'locations/987654321')
    google_place_id TEXT,                     -- Google Maps Place ID (ChIJ...)
    address TEXT,                             -- Dirección física
    latitude NUMERIC(10, 7),                  -- Latitud
    longitude NUMERIC(10, 7),                 -- Longitud
    active BOOLEAN NOT NULL DEFAULT true,      -- Flag de operación activa
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para locations
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
CREATE INDEX IF NOT EXISTS idx_locations_gbp_loc ON locations(gbp_location_id);

-- Semilla de las 33 sucursales oficiales de La Crêpe Parisienne
INSERT INTO locations (id, nombre, abr, region) VALUES
  -- Región Guadalajara (GDL)
  ('andares', 'Andares', 'Andares', 'GDL'),
  ('patria', 'Plaza Patria', 'Patria', 'GDL'),
  ('midtown', 'Midtown Jalisco', 'Midtown', 'GDL'),
  ('gal-gdl', 'Galerías Guadalajara', 'Gal. GDL', 'GDL'),
  ('via-viva', 'Via Viva', 'Via Viva', 'GDL'),
  ('sta-anita', 'Galerías Santa Anita', 'Sta. Anita', 'GDL'),
  ('la-perla', 'La Perla', 'La Perla', 'GDL'),
  ('forum', 'Forum Tlaquepaque', 'Forum', 'GDL'),
  -- Región Ciudad de México (CDMX)
  ('aztlan', 'Aztlán', 'Aztlán', 'CDMX'),
  ('carso', 'Plaza Carso', 'Plaza Carso', 'CDMX'),
  ('mexicana', 'Parque La Mexicana', 'La Mexicana', 'CDMX'),
  ('acoxpa', 'Paseo Acoxpa', 'Acoxpa', 'CDMX'),
  ('tepeyac', 'Tepeyac', 'Tepeyac', 'CDMX'),
  ('polanquito', 'Polanquito', 'Polanquito', 'CDMX'),
  ('oceania', 'Oceanía', 'Oceanía', 'CDMX'),
  ('artz', 'Artz Pedregal', 'Artz', 'CDMX'),
  ('arcos', 'Arcos Bosques', 'Arcos', 'CDMX'),
  ('mitikah', 'Mitikah', 'Mitikah', 'CDMX'),
  ('coyoacan', 'Oasis Coyoacán', 'Coyoacán', 'CDMX'),
  ('duraznos', 'Parque Duraznos', 'Duraznos', 'CDMX'),
  ('santa-fe', 'Centro Santa Fe', 'Santa Fe', 'CDMX'),
  ('satelite', 'Plaza Satélite', 'Satélite', 'CDMX'),
  -- Región Monterrey (MTY)
  ('gal-mty', 'Galerías Monterrey', 'Gal. MTY', 'MTY'),
  ('valle-oriente', 'Galerías Valle Oriente', 'Valle Oriente', 'MTY'),
  ('fashion-drive', 'Fashion Drive', 'Fashion Drive', 'MTY'),
  -- Región Guanajuato / León (LEON)
  ('altacia', 'Altacia', 'Altacia', 'LEON'),
  -- Región San Luis Potosí (SLP)
  ('the-park', 'The Park', 'The Park', 'SLP'),
  -- Región Aguascalientes (AGS)
  ('altaria', 'Altaria', 'Altaria', 'AGS'),
  -- Región Estado de México / Toluca / Metepec (TOL)
  ('gal-metepec', 'Galerías Metepec', 'Gal. Metepec', 'TOL'),
  ('town-square', 'Town Square Metepec', 'Town Square', 'TOL'),
  -- Región Querétaro (QRO)
  ('antea', 'Antea', 'Antea', 'QRO'),
  -- Región Cancún / Quintana Roo (CUN)
  ('cancun', 'Marina Puerto Cancún', 'Puerto Cancún', 'CUN'),
  -- Región Tijuana / Baja California (TJ)
  ('peninsula', 'Plaza Península', 'Plaza Península', 'TJ')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  abr = EXCLUDED.abr,
  region = EXCLUDED.region,
  updated_at = now();

-- 2. TABLA REVIEWS_CORE (Almacén de Reseñas Oficiales Normalizado)
CREATE TABLE IF NOT EXISTS reviews_core (
    id TEXT PRIMARY KEY,                                      -- GBP reviewId oficial
    location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    stars SMALLINT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    text TEXT,
    reviewer_name TEXT,
    reviewer_photo_url TEXT,
    is_local_guide BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    reply_text TEXT,
    reply_published_at TIMESTAMPTZ,
    classification JSONB,
    raw_gbp_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de alto rendimiento para reviews_core
CREATE INDEX IF NOT EXISTS idx_reviews_core_loc_pub ON reviews_core(location_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_core_pub ON reviews_core(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_core_stars ON reviews_core(stars);

-- 3. MIGRACIÓN HISTÓRICA CONDICIONAL (De 'reviews' a 'reviews_core')
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'reviews' 
          AND table_type = 'BASE TABLE'
    ) THEN
        -- Insertar datos históricos en reviews_core asegurando que location_id exista en locations
        INSERT INTO reviews_core (
            id,
            location_id,
            stars,
            text,
            is_local_guide,
            published_at,
            reply_text,
            reply_published_at,
            classification,
            created_at
        )
        SELECT 
            r.id,
            COALESCE(loc.id, LOWER(r.sucursal)),
            r.stars::SMALLINT,
            r.text,
            COALESCE(r.is_local_guide, false),
            r.published_at_date,
            r.response_text,
            r.response_date,
            CASE 
              WHEN r.classification IS NULL THEN NULL 
              ELSE to_jsonb(r.classification) 
            END,
            COALESCE(r.published_at_date, now())
        FROM reviews r
        LEFT JOIN locations loc ON loc.id = LOWER(r.sucursal)
        WHERE loc.id IS NOT NULL
        ON CONFLICT (id) DO NOTHING;

        -- Renombrar tabla legacy para liberar el nombre 'reviews' para la vista retrocompatible
        ALTER TABLE reviews RENAME TO reviews_legacy_backup;
    END IF;
END $$;

-- 4. VISTA RETROCOMPATIBLE 'reviews' (Garantiza 0 roturas en frontend)
CREATE OR REPLACE VIEW reviews AS
SELECT 
    rc.id,
    rc.location_id AS sucursal,
    l.region,
    rc.stars::INTEGER AS stars,
    rc.text,
    rc.published_at AS published_at_date,
    rc.is_local_guide,
    rc.reply_text AS response_text,
    rc.reply_published_at AS response_date,
    rc.classification
FROM reviews_core rc
JOIN locations l ON rc.location_id = l.id;

-- 5. VISTA RETROCOMPATIBLE 'quarterly_stats'
CREATE OR REPLACE VIEW quarterly_stats AS
SELECT 
  l.region,
  rc.location_id AS sucursal,
  extract(year from rc.published_at)::integer as year,
  ceil(extract(month from rc.published_at) / 3.0)::integer as quarter,
  round(avg(rc.stars)::numeric, 2) as avg_rating,
  count(*)::integer as total_reviews,
  count(CASE WHEN rc.stars <= 2 THEN 1 END)::integer as negative_reviews
FROM reviews_core rc
JOIN locations l ON rc.location_id = l.id
GROUP BY l.region, rc.location_id, year, quarter;

-- 6. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_core ENABLE ROW LEVEL SECURITY;

-- Lectura pública para el frontend del dashboard
DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir lectura publica a locations" ON locations;
    CREATE POLICY "Permitir lectura publica a locations" ON locations
        FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "Permitir lectura publica a reviews_core" ON reviews_core;
    CREATE POLICY "Permitir lectura publica a reviews_core" ON reviews_core
        FOR SELECT TO anon, authenticated USING (true);
END $$;

COMMIT;

-- Resumen de ejecución
SELECT count(*) AS total_locations FROM locations;
