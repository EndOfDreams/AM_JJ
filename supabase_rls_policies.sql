-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Script de sécurisation pour AM_jj
-- ============================================

-- ============================================
-- RLS pour la table photos
-- ============================================
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Lecture : Tout le monde peut voir les photos
CREATE POLICY "Anyone can view photos"
ON public.photos FOR SELECT
USING (true);

-- Insertion : Utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated users can insert photos"
ON public.photos FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Mise à jour : Utilisateurs peuvent modifier leurs propres photos
CREATE POLICY "Users can update own photos"
ON public.photos FOR UPDATE
TO authenticated
USING (created_by = auth.email());

-- Suppression : Utilisateurs peuvent supprimer leurs propres photos
CREATE POLICY "Users can delete own photos"
ON public.photos FOR DELETE
TO authenticated
USING (created_by = auth.email());

-- ============================================
-- RLS pour la table guests
-- ============================================
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Lecture : Utilisateurs authentifiés peuvent voir tous les profils
CREATE POLICY "Authenticated users can view all guests"
ON public.guests FOR SELECT
TO authenticated
USING (true);

-- Insertion : Uniquement via service role (trigger automatique)
CREATE POLICY "Service role can insert guests"
ON public.guests FOR INSERT
TO service_role
WITH CHECK (true);

-- Mise à jour : Utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
ON public.guests FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- RLS pour la table PlanningEvent
-- ============================================
ALTER TABLE public."PlanningEvent" ENABLE ROW LEVEL SECURITY;

-- Lecture : Tout le monde peut voir les événements
CREATE POLICY "Anyone can view planning events"
ON public."PlanningEvent" FOR SELECT
USING (true);

-- Mise à jour : Utilisateurs authentifiés peuvent mettre à jour les événements
CREATE POLICY "Authenticated users can update events"
ON public."PlanningEvent" FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que RLS est activé sur toutes les tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('photos', 'guests', 'PlanningEvent')
ORDER BY tablename;

-- Lister toutes les policies créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "Command",
    qual as "Using Expression"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
