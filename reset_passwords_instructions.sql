-- ============================================
-- RÉINITIALISER LES MOTS DE PASSE
-- ============================================
-- Ce script va mettre à jour les mots de passe dans Supabase Auth
-- pour qu'ils correspondent aux mots de passe de la table guests

-- IMPORTANT: Vous devez utiliser la clé SERVICE_ROLE (pas anon key) pour cela
-- Allez dans Dashboard > Settings > API > service_role key

-- Voici les utilisateurs et leurs mots de passe d'après vos captures:
-- camille.peres@wedding.local → admin
-- jean.dupont@wedding.local → 123456  
-- anne-marie.cabanac@wedding.local → password
-- herve@wedding.local → pass
-- marie@wedding.local → marie

-- Malheureusement, on ne peut pas réinitialiser les mots de passe via SQL directement
-- Il faut utiliser l'API Supabase Admin

-- SOLUTION: Utiliser le dashboard Supabase
-- 1. Allez sur: https://supabase.com/dashboard/project/sxdgvuqawjehfjexziwu/auth/users
-- 2. Pour chaque utilisateur, cliquez sur les 3 points → "Reset Password"
-- 3. Définissez le mot de passe selon la table guests

-- OU utilisez ce script Node.js pour le faire automatiquement
