-- DÉBLOCAGE FINAL DE LA BASE DE DONNÉES
-- À exécuter dans le Dashboard Supabase (SQL Editor) : https://supabase.com/dashboard/project/sxdgvuqawjehfjexziwu/sql

-- 1. Désactiver la sécurité (RLS) sur les tables d'authentification
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities DISABLE ROW LEVEL SECURITY;

-- 2. Désactiver la sécurité sur les tables publiques
ALTER TABLE public.guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;

-- 3. Nettoyer les triggers bloquants
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Vérification
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname IN ('auth', 'public');
