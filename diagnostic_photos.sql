-- Script de diagnostic pour identifier le problème avec la table photos

-- 1. Vérifier le type de la colonne liked_by
SELECT 
  column_name,
  data_type,
  udt_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'photos'
  AND column_name = 'liked_by';

-- 2. Afficher quelques photos avec leurs likes pour voir le format des données
SELECT 
  id,
  likes,
  liked_by,
  pg_typeof(liked_by) as type_de_liked_by,
  created_at
FROM public.photos
ORDER BY created_at DESC
LIMIT 5;

-- 3. Vérifier si liked_by contient des données
SELECT 
  id,
  likes,
  CASE 
    WHEN liked_by IS NULL THEN 'NULL'
    WHEN array_length(liked_by, 1) IS NULL THEN 'TABLEAU VIDE'
    ELSE 'CONTIENT DES DONNEES: ' || array_to_string(liked_by, ', ')
  END as statut_liked_by
FROM public.photos
ORDER BY created_at DESC
LIMIT 10;
