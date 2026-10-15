-- ============================================================================
-- supabase_incidents.sql — Seguimiento de incidencias por reseña (roadmap pilar F)
-- Ejecutado el 2026-10-15 (2.0.0-beta.8). Idempotente: se puede volver a correr. Reversible (ver ROLLBACK al final).
--
-- Una incidencia nace de una reseña (normalmente una "Grave") y tiene: estado, responsable y una bitácora
-- con quién hizo qué y cuándo. El front funciona sin esta tabla (oculta el seguimiento) hasta que se ejecute.
--
-- Acceso (decisión 2026-10-15, modelo de roles de Ibrahim):
--   VER: quien ve la sucursal (visible_location_ids(): admin/regional/zonal → todas, gerente → su región).
--   ABRIR/ACTUALIZAR: admin/regional/zonal en cualquier sucursal que ven; el gerente solo en SU tienda
--   (profiles.sucursal; si no tiene tienda asignada, en ninguna). No hay borrado desde la app.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.review_incidents (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id    text NOT NULL UNIQUE REFERENCES public.reviews_core(id) ON DELETE CASCADE,
    location_id  text NOT NULL REFERENCES public.locations(id),
    status       text NOT NULL DEFAULT 'nueva' CHECK (status IN ('nueva', 'en_revision', 'respondida', 'resuelta')),
    owner        text,                                   -- responsable (nombre libre)
    severity     text NOT NULL DEFAULT 'queja' CHECK (severity IN ('grave', 'queja')),
    opened_by    uuid DEFAULT auth.uid() REFERENCES auth.users(id),
    opened_at    timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    resolved_at  timestamptz,
    history      jsonb NOT NULL DEFAULT '[]'::jsonb      -- [{ at, by, status, owner, note }]
);

CREATE INDEX IF NOT EXISTS review_incidents_location_idx ON public.review_incidents (location_id);
CREATE INDEX IF NOT EXISTS review_incidents_status_idx   ON public.review_incidents (status);

CREATE OR REPLACE FUNCTION public.review_incidents_touch() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS review_incidents_touch ON public.review_incidents;
CREATE TRIGGER review_incidents_touch BEFORE UPDATE ON public.review_incidents
    FOR EACH ROW EXECUTE FUNCTION public.review_incidents_touch();

-- Sucursales cuyas incidencias puede abrir/actualizar quien consulta
CREATE OR REPLACE FUNCTION public.editable_location_ids()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT l.id
    FROM locations l
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.rol IN ('admin', 'director', 'regional', 'zonal')
       OR (p.rol = 'gerente' AND p.sucursal = l.id)
$$;
REVOKE ALL ON FUNCTION public.editable_location_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.editable_location_ids() TO authenticated;

ALTER TABLE public.review_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incidents_select ON public.review_incidents;
CREATE POLICY incidents_select ON public.review_incidents FOR SELECT TO authenticated
    USING (location_id IN (SELECT public.visible_location_ids()));

DROP POLICY IF EXISTS incidents_insert ON public.review_incidents;
CREATE POLICY incidents_insert ON public.review_incidents FOR INSERT TO authenticated
    WITH CHECK (location_id IN (SELECT public.editable_location_ids()));

DROP POLICY IF EXISTS incidents_update ON public.review_incidents;
CREATE POLICY incidents_update ON public.review_incidents FOR UPDATE TO authenticated
    USING (location_id IN (SELECT public.editable_location_ids()))
    WITH CHECK (location_id IN (SELECT public.editable_location_ids()));

REVOKE ALL ON public.review_incidents FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.review_incidents TO authenticated;
GRANT ALL ON public.review_incidents TO service_role;

COMMIT;

-- ROLLBACK:
--   DROP TABLE IF EXISTS public.review_incidents;
--   DROP FUNCTION IF EXISTS public.review_incidents_touch();
--   DROP FUNCTION IF EXISTS public.editable_location_ids();
