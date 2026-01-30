-- Supprime toutes les entrées de la table photos
-- Cela retirera les photos de l'application
delete from public.photos;

-- Note: Les fichiers restent dans le stockage (Storage > wedding-media)
-- Pour supprimer les fichiers, il faut aller dans le menu Storage du dashboard Supabase,
-- sélectionner le bucket 'wedding-media' et cliquer sur 'Empty bucket' ou tout sélectionner et supprimer.
