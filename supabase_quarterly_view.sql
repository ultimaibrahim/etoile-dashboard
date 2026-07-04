-- Script para crear la vista de estadísticas trimestrales en Supabase
-- Ejecuta este script en el SQL Editor de tu consola de Supabase.

CREATE OR REPLACE VIEW quarterly_stats AS
SELECT 
  region,
  sucursal,
  extract(year from published_at_date)::integer as year,
  ceil(extract(month from published_at_date) / 3.0)::integer as quarter,
  round(avg(stars)::numeric, 2) as avg_rating,
  count(*)::integer as total_reviews,
  count(CASE WHEN stars <= 2 THEN 1 END)::integer as negative_reviews
FROM reviews
GROUP BY region, sucursal, year, quarter;
