-- SÉCURISATION PRUDENTE (SAFE RLS)
-- Copiez ce script dans l'éditeur SQL de Supabase et exécutez-le.

-- 1. Activer RLS sur les tables publiques (Protection des données)
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 2. GUESTS : Tout le monde peut LIRE (nécessaire pour le login), mais seul le propriétaire peut MODIFIER
DROP POLICY IF EXISTS "Public Read Guests" ON public.guests;
CREATE POLICY "Public Read Guests" ON public.guests FOR SELECT USING (true);

DROP POLICY IF EXISTS "User Update Own Guest" ON public.guests;
CREATE POLICY "User Update Own Guest" ON public.guests FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth Insert Guest" ON public.guests;
CREATE POLICY "Auth Insert Guest" ON public.guests FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. PHOTOS : Tout le monde peut voir les photos, tout inscrit peut en publier
DROP POLICY IF EXISTS "Public Read Photos" ON public.photos;
CREATE POLICY "Public Read Photos" ON public.photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth Insert Photos" ON public.photos;
CREATE POLICY "Auth Insert Photos" ON public.photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Note importante : On ne verrouille pas les tables système 'auth' pour éviter le bug "Error 42501" de Supabase.
