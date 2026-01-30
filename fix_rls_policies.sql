-- ============================================
-- FIX RLS POLICIES POUR L'AUTHENTIFICATION
-- ============================================

-- 1. Supprimer toutes les anciennes politiques sur la table guests
DROP POLICY IF EXISTS "Users can read their own guest profile" ON guests;
DROP POLICY IF EXISTS "Users can update their own guest profile" ON guests;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON guests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON guests;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON guests;

-- 2. Créer une politique simple pour permettre la lecture lors de l'authentification
-- IMPORTANT: Cette politique permet à un utilisateur authentifié de lire son propre profil
CREATE POLICY "Allow users to read own profile"
ON guests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Politique pour permettre la mise à jour de son propre profil
CREATE POLICY "Allow users to update own profile"
ON guests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. VÉRIFICATION: Afficher les politiques actuelles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'guests';

-- 5. Vérifier que RLS est bien activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'guests';
