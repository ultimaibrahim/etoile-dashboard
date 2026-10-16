-- ============================================================================
-- supabase_rls_scoped.sql — Lectura por alcance (rol/región/sucursal) en la base
-- EJECUTADO en producción el 2026-10-09 y verificado con sesiones reales de cada rol.
-- Reversible (ver ROLLBACK al final). Es idempotente: se puede volver a correr.
--
-- Hoy el recorte por rol solo ocurre en el navegador (js/router.js + js/data.js).
-- Con estas políticas la base impone la misma matriz que ya usa el frontend:
--   admin / director / regional → todas las sucursales (y el panel "étoile corporativo", #/brand)
--   zonal                       → todas las regiones (sin #/brand)
--   gerente                     → las sucursales de su región asignada + su propia tienda
--   anon / rol desconocido / sin perfil → nada (falla cerrado)
-- Nota: hoy profiles_rol_check solo admite admin / regional / zonal / gerente ('director' no existe
-- en la base). Por ahora los directores y Oliver (único regional) usan el rol admin.
-- El panel corporativo es una puerta de la interfaz: consume los mismos datos que ya puede
-- leer un zonal, así que no requiere permisos extra en la base.
-- Las funciones de Netlify usan service_role y NO se ven afectadas por RLS.
-- ============================================================================
BEGIN;

-- Una sola función define "qué sucursales ve quien consulta". Evaluada una vez por consulta
-- (subconsulta no correlacionada → InitPlan), no una vez por fila.
CREATE OR REPLACE FUNCTION public.visible_location_ids()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT l.id
    FROM locations l
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.rol IN ('admin', 'director', 'regional', 'zonal')
       OR (p.rol = 'gerente' AND (p.region = l.region OR p.sucursal = l.id))
$$;
REVOKE ALL ON FUNCTION public.visible_location_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visible_location_ids() TO authenticated;

DROP POLICY IF EXISTS "Permitir lectura publica a reviews_core" ON reviews_core;
DROP POLICY IF EXISTS "Lectura por alcance reviews_core" ON reviews_core;
CREATE POLICY "Lectura por alcance reviews_core" ON reviews_core
    FOR SELECT TO authenticated
    USING (location_id IN (SELECT public.visible_location_ids()));

DROP POLICY IF EXISTS "Permitir lectura publica a locations" ON locations;
DROP POLICY IF EXISTS "Lectura por alcance locations" ON locations;
CREATE POLICY "Lectura por alcance locations" ON locations
    FOR SELECT TO authenticated
    USING (id IN (SELECT public.visible_location_ids()));

-- Las vistas deben correr con los permisos de quien consulta, no de su dueño
ALTER VIEW reviews          SET (security_invoker = true);
ALTER VIEW quarterly_stats  SET (security_invoker = true);
ALTER VIEW review_months    SET (security_invoker = true);

REVOKE SELECT ON reviews, quarterly_stats, review_months, reviews_core, locations FROM anon;
COMMIT;

-- ── Pruebas sugeridas (con sesión real de cada rol en el frontend) ──────────
-- gerente de Andares → las 8 sucursales de GDL y ninguna de otra región;  zonal → todas;
-- admin → todas y con acceso a #/brand;  sin sesión → 0 filas.

-- ── ROLLBACK (volver al estado actual: lectura pública) ─────────────────────
-- BEGIN;
-- ALTER VIEW reviews SET (security_invoker = false);
-- ALTER VIEW quarterly_stats SET (security_invoker = false);
-- ALTER VIEW review_months SET (security_invoker = false);
-- DROP POLICY IF EXISTS "Lectura por alcance reviews_core" ON reviews_core;
-- DROP POLICY IF EXISTS "Lectura por alcance locations" ON locations;
-- CREATE POLICY "Permitir lectura publica a reviews_core" ON reviews_core FOR SELECT TO anon, authenticated USING (true);
-- CREATE POLICY "Permitir lectura publica a locations"    ON locations    FOR SELECT TO anon, authenticated USING (true);
-- GRANT SELECT ON reviews, quarterly_stats, review_months, reviews_core, locations TO anon;
-- COMMIT;
