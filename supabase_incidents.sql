-- ============================================================================
-- supabase_incidents.sql — Seguimiento de incidencias por reseña (roadmap pilar F)
-- NO ejecutado. Idempotente: se puede volver a correr. Reversible (ver ROLLBACK al final).
--
-- Una incidencia nace de una reseña (normalmente una "Grave") y tiene: estado, responsable y una bitácora
-- con quién hizo qué y cuándo. El front funciona sin esta tabla (oculta el seguimiento) hasta que se ejecute.
--
-- Acceso: quien puede VER una sucursal (visible_location_ids(): corporate/admin/regional/zonal → todas,
-- gerente → su región) puede abrir y actualizar incidencias de esa sucursal. No hay borrado desde la app.
-- Si se quiere que los gerentes solo lean, basta cambiar las políticas de INSERT/UPDATE a los demás roles.
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

ALTER TABLE public.review_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incidents_select ON public.review_incidents;
CREATE POLICY incidents_select ON public.review_incidents FOR SELECT TO authenticated
    USING (location_id IN (SELECT public.visible_location_ids()));

DROP POLICY IF EXISTS incidents_insert ON public.review_incidents;
CREATE POLICY incidents_insert ON public.review_incidents FOR INSERT TO authenticated
    WITH CHECK (location_id IN (SELECT public.visible_location_ids()));

DROP POLICY IF EXISTS incidents_update ON public.review_incidents;
CREATE POLICY incidents_update ON public.review_incidents FOR UPDATE TO authenticated
    USING (location_id IN (SELECT public.visible_location_ids()))
    WITH CHECK (location_id IN (SELECT public.visible_location_ids()));

REVOKE ALL ON public.review_incidents FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.review_incidents TO authenticated;
GRANT ALL ON public.review_incidents TO service_role;

COMMIT;

-- ROLLBACK:
--   DROP TABLE IF EXISTS public.review_incidents;
--   DROP FUNCTION IF EXISTS public.review_incidents_touch();
