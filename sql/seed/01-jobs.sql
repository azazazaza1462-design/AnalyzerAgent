-- Seed demo Jobs for the Analyzers UI (TLOS-163).
-- Apply manually via psql, e.g.:
--   psql -h localhost -p 5433 -U lendlogic -d analyzers_dev -f sql/seed/01-jobs.sql
--
-- Idempotent: re-running won't insert duplicates because every row has a
-- deterministic UUID (ON CONFLICT DO NOTHING on the primary key).
--
-- Requires sql/seed/00-callers.sql to have been applied first so the
-- "Lendlogic LOS" caller exists.

WITH caller AS (
    SELECT id FROM app.callers WHERE name = 'Lendlogic LOS' LIMIT 1
)
INSERT INTO app.jobs (id, caller_id, job_type, job_status, machine_id, started_at, finished_at, content, attachments, created_at, updated_at)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, caller.id, 'CreditAnalysis', 'Completed', 'agent-01',
       now() - interval '3 hours', now() - interval '2 hours',
       '{"applicantId":"A-001","amount":25000}'::jsonb, ARRAY[]::uuid[],
       now() - interval '3 hours', now() - interval '2 hours'
FROM caller
UNION ALL
SELECT '22222222-2222-2222-2222-222222222222'::uuid, caller.id, 'RiskAssessment', 'InProgress', 'agent-02',
       now() - interval '40 minutes', NULL,
       '{"applicantId":"A-002"}'::jsonb, ARRAY[]::uuid[],
       now() - interval '45 minutes', now() - interval '10 minutes'
FROM caller
UNION ALL
SELECT '33333333-3333-3333-3333-333333333333'::uuid, caller.id, 'FraudDetection', 'Pending', NULL,
       NULL, NULL,
       '{"transactionIds":["T-100","T-101","T-102"]}'::jsonb, ARRAY[]::uuid[],
       now() - interval '8 minutes', NULL
FROM caller
UNION ALL
SELECT '44444444-4444-4444-4444-444444444444'::uuid, caller.id, 'CreditAnalysis', 'Failed', 'agent-01',
       now() - interval '1 day', now() - interval '1 day' + interval '5 minutes',
       '{"applicantId":"A-003","amount":9000}'::jsonb, ARRAY[]::uuid[],
       now() - interval '1 day', now() - interval '1 day' + interval '5 minutes'
FROM caller
UNION ALL
SELECT '55555555-5555-5555-5555-555555555555'::uuid, caller.id, 'CreditAnalysis', 'Completed', 'agent-03',
       now() - interval '2 days', now() - interval '2 days' + interval '20 minutes',
       NULL, ARRAY[]::uuid[],
       now() - interval '2 days', now() - interval '2 days' + interval '20 minutes'
FROM caller
UNION ALL
SELECT '66666666-6666-6666-6666-666666666666'::uuid, caller.id, 'RiskAssessment', 'Pending', NULL,
       NULL, NULL,
       NULL, ARRAY[]::uuid[],
       now() - interval '3 days', NULL
FROM caller
ON CONFLICT (id) DO NOTHING;
