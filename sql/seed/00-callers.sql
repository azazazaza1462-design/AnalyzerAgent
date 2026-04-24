-- Seed initial Caller rows consumed by POST /api/v1/jobs.
-- Apply manually via psql, e.g.:
--   psql -h localhost -U lendlogic -d analyzers_dev -f sql/seed/00-callers.sql

INSERT INTO app.callers (id, name, created_at)
VALUES (gen_random_uuid(), 'Lendlogic LOS', now())
ON CONFLICT (name) DO NOTHING;
