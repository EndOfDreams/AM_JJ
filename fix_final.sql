-- DÉSACTIVER RLS SUR TOUTES LES TABLES
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE planning_events DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Allow users to read own profile" ON guests;
DROP POLICY IF EXISTS "Allow users to update own profile" ON guests;
DROP POLICY IF EXISTS "Allow authenticated read" ON guests;

-- Vérifier
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
