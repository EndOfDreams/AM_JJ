-- ============================================
-- SOLUTION: Désactiver temporairement RLS pour le diagnostic
-- ============================================

-- Étape 1: Désactiver temporairement RLS sur guests
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;

-- Étape 2: Vérifier que ça fonctionne
-- Après avoir exécuté cette commande, testez l'authentification
-- Si ça fonctionne, le problème vient bien des politiques RLS

-- Étape 3: Une fois confirmé, réactiver RLS avec les bonnes politiques
-- ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Étape 4: Créer des politiques plus permissives
-- DROP POLICY IF EXISTS "Allow authenticated read" ON guests;
-- CREATE POLICY "Allow authenticated read"
-- ON guests FOR SELECT
-- TO authenticated
-- USING (true);

-- Étape 5: Vérifier l'état actuel
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'guests';
