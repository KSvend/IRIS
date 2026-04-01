-- Enable Row-Level Security on all tables.
-- All data access goes through the FastAPI backend using the service_role key,
-- which bypasses RLS. The anon key (used by frontend for auth only) should not
-- have direct table access.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).

-- 1. Enable RLS on every table
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_annotations ENABLE ROW LEVEL SECURITY;

-- 2. By default, with RLS enabled and no policies, all access via the anon key
--    is denied. The service_role key bypasses RLS entirely.
--
--    This is the correct setup for IRIS because:
--    - Frontend (anon key) only uses Supabase for authentication
--    - All data queries go through FastAPI backend (service_role key)
--    - GitHub Actions workflows also use the service_role key
--
--    If you later need the anon key to read specific tables (e.g., for a
--    public dashboard), add selective policies like:
--
--    CREATE POLICY "Allow authenticated read on aggregated_stats"
--      ON aggregated_stats FOR SELECT
--      TO authenticated
--      USING (true);

-- 3. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
