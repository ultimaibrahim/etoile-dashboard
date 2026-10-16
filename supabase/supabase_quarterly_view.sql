-- Script para crear la vista de estadísticas trimestrales en Supabase
-- Ejecuta este script en el SQL Editor de tu consola de Supabase.

CREATE OR REPLACE VIEW quarterly_stats AS
SELECT 
  region,
  sucursal,
  -- Corte de mes/trimestre en hora de CDMX (igual que el front: BranchTime.monthStartIso)
  extract(year from published_at_date at time zone 'America/Mexico_City')::integer as year,
  ceil(extract(month from published_at_date at time zone 'America/Mexico_City') / 3.0)::integer as quarter,
  round(avg(stars)::numeric, 2) as avg_rating,
  count(*)::integer as total_reviews,
  -- Queja = 1–2★ (las sin texto ya se excluyeron arriba, en el WHERE)
  count(CASE WHEN stars <= 2 THEN 1 END)::integer as negative_reviews
FROM reviews
-- 1–2★ sin texto se descartan del todo (igual que Metrics.isDiscarded en el front)
WHERE NOT (stars <= 2 AND coalesce(btrim(text), '') = '')
GROUP BY region, sucursal, year, quarter;
