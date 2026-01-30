-- Vérifier les triggers sur auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
   OR event_object_table IN ('guests', 'users');

-- Vérifier les fonctions liées à l'authentification
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('auth', 'public')
  AND (p.proname LIKE '%guest%' OR p.proname LIKE '%auth%')
ORDER BY n.nspname, p.proname;

-- Vérifier toutes les politiques RLS sur guests
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'guests';
