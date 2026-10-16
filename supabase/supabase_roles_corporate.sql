-- ============================================================================
-- supabase_roles_corporate.sql — Rol `corporate` (roadmap A10) con alias legacy
-- NO ejecutado. Se corre en DOS fases para no dejar a nadie sin acceso:
--   FASE 1 (antes del deploy): la base acepta `corporate` además de los roles actuales.
--   deploy del frontend v3.5.0j (reconoce `corporate`; sigue aceptando admin/regional/director).
--   FASE 2 (después del deploy): admin/regional pasan a corporate y se retiran los alias.
-- Matriz resultante: corporate → todo + #/brand · zonal → todas las regiones · gerente → su región.
-- ============================================================================

-- ───────── FASE 1 ─────────
BEGIN;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check
    CHECK (rol IN ('corporate', 'admin', 'regional', 'zonal', 'gerente'));

CREATE OR REPLACE FUNCTION public.visible_location_ids()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT l.id
    FROM locations l
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.rol IN ('corporate', 'admin', 'regional', 'zonal')
       OR (p.rol = 'gerente' AND (p.region = l.region OR p.sucursal = l.id))
$$;
REVOKE ALL ON FUNCTION public.visible_location_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visible_location_ids() TO authenticated;

COMMIT;

-- ───────── FASE 2 (solo tras el deploy) ─────────
-- BEGIN;
-- UPDATE public.profiles SET rol = 'corporate' WHERE rol IN ('admin', 'regional');
-- ALTER TABLE public.profiles DROP CONSTRAINT profiles_rol_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check
--     CHECK (rol IN ('corporate', 'zonal', 'gerente'));
-- CREATE OR REPLACE FUNCTION public.visible_location_ids() RETURNS SETOF text
-- LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
--     SELECT l.id FROM locations l JOIN profiles p ON p.id = auth.uid()
--     WHERE p.rol IN ('corporate', 'zonal')
--        OR (p.rol = 'gerente' AND (p.region = l.region OR p.sucursal = l.id))
-- $$;
-- COMMIT;

-- Si la fase 2 falla: UPDATE profiles SET rol = 'admin' WHERE rol = 'corporate'; y recrear el check
-- con ('admin','regional','zonal','gerente').
