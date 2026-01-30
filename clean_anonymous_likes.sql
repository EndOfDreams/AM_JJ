-- Nettoyer tous les likes "anonymous" de la base de données
-- Ce script remet tous les compteurs de likes à zéro

-- Réinitialiser tous les likes
UPDATE public.photos
SET 
  liked_by = '{}',
  likes = 0;

-- Vérifier le résultat
SELECT 
  id,
  likes,
  liked_by,
  CASE 
    WHEN array_length(liked_by, 1) IS NULL THEN 'TABLEAU VIDE (OK)'
    ELSE 'CONTIENT DES DONNEES: ' || array_to_string(liked_by, ', ')
  END as statut_liked_by
FROM public.photos
ORDER BY created_at DESC$$
LIMIT 10;
