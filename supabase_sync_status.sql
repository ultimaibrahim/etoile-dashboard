-- supabase_sync_status.sql — Última sincronización con Google por sucursal (Étoile 2.0.0-beta.8)
-- gbp-sync marca la hora en cada sucursal que consultó sin error, aunque no hubiera reseñas nuevas
-- (reviews_core.synced_at no sirve: las filas sin cambios ya no se reescriben).
-- Lectura: la política "Lectura por alcance locations" ya cubre la columna nueva.

ALTER TABLE locations ADD COLUMN IF NOT EXISTS gbp_synced_at TIMESTAMPTZ;
