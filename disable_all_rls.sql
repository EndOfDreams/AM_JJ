-- DÉSACTIVER COMPLÈTEMENT RLS SUR TOUTES LES TABLES (y compris auth)
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.refresh_tokens DISABLE ROW LEVEL SECURITY;

-- Tables publiques
ALTER TABLE IF EXISTS public.guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.planning_events DISABLE ROW LEVEL SECURITY;

-- Vérifier toutes les tables
SELECT 
    schemaname,
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;
