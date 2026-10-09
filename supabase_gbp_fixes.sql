-- ============================================================================
-- supabase_gbp_fixes.sql — Correcciones post-migración GBP (Étoile Zenith v3.5.0f)
-- Ejecutar en Supabase → SQL Editor. Las secciones 1 y 2 son independientes.
-- ============================================================================

-- ── 1. REQUERIDO: review_months debe leer de reviews_core ───────────────────
-- La vista seguía apuntando a la tabla vieja (renombrada a reviews_legacy_backup en la
-- migración), cuyo último mes es agosto 2026. Sin septiembre/octubre en el calendario,
-- el DataLoader nunca pide esos meses aunque las reseñas ya estén en reviews_core.
-- Columnas y orden idénticos a los que lee js/data-loader.js: year, month, region.
BEGIN;
DROP VIEW IF EXISTS review_months;
CREATE VIEW review_months AS
SELECT DISTINCT
    extract(year  FROM rc.published_at)::integer AS year,
    extract(month FROM rc.published_at)::integer AS month,
    l.region
FROM reviews_core rc
JOIN locations l ON l.id = rc.location_id;
GRANT SELECT ON review_months TO anon, authenticated, service_role;
COMMIT;

-- Verificación esperada: la fila de cada región llega a 2026-10 (CDMX, GDL, MTY, CUN, TJ, TOL)
-- SELECT region, max(year*100+month) FROM review_months GROUP BY region ORDER BY 1;

-- ── 2. RECOMENDADO (revisar antes): cerrar la lectura anónima de reseñas ────
-- Hoy la clave anónima (pública en el frontend) puede leer TODA la vista `reviews` y la
-- tabla reviews_core (texto, clasificaciones, nombres y fotos de reseñadores, payload crudo).
-- La tabla anterior no era legible con la clave anónima. La vista corre con los permisos de su
-- dueño y se salta el RLS de reviews_core; con security_invoker aplican las políticas del usuario.
-- OJO: tras esto solo los usuarios con sesión (rol `authenticated`) verán reseñas. Si alguna
-- pantalla pública las necesita, NO ejecutar esta sección.
--
-- BEGIN;
-- DROP POLICY IF EXISTS "Permitir lectura publica a reviews_core" ON reviews_core;
-- CREATE POLICY "Lectura autenticada reviews_core" ON reviews_core FOR SELECT TO authenticated USING (true);
-- ALTER VIEW reviews SET (security_invoker = true);
-- ALTER VIEW quarterly_stats SET (security_invoker = true);
-- ALTER VIEW review_months SET (security_invoker = true);
-- COMMIT;
