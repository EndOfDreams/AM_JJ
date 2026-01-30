-- Script de vérification rapide de la structure de la table photos
-- Exécutez ce script pour vérifier que la table est correctement configurée

-- 1. Vérifier que la table existe
select exists (
  select from information_schema.tables 
  where table_schema = 'public' 
  and table_name = 'photos'
) as table_exists;

-- 2. Afficher la structure complète de la table
select 
  column_name, 
  data_type, 
  column_default,
  is_nullable,
  character_maximum_length
from information_schema.columns
where table_schema = 'public' 
  and table_name = 'photos'
order by ordinal_position;

-- 3. Vérifier que liked_by est bien un tableau
select 
  column_name,
  data_type,
  udt_name
from information_schema.columns
where table_schema = 'public' 
  and table_name = 'photos'
  and column_name = 'liked_by';

-- 4. Compter les photos et afficher quelques statistiques
select 
  count(*) as total_photos,
  count(case when likes > 0 then 1 end) as photos_avec_likes,
  sum(likes) as total_likes,
  round(avg(likes), 2) as moyenne_likes
from public.photos;

-- 5. Afficher les 5 dernières photos avec leurs likes
select 
  id,
  substring(image_url, 1, 50) || '...' as image_url_preview,
  media_type,
  likes,
  liked_by,
  created_by,
  created_at
from public.photos
order by created_at desc
limit 5;

-- 6. Vérifier les politiques RLS
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public' 
  and tablename = 'photos';

-- 7. Vérifier si RLS est activé
select 
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public' 
  and tablename = 'photos';

-- 8. Test rapide : vérifier qu'on peut ajouter un like
-- (Ce test n'ajoute pas réellement de données, il vérifie juste la syntaxe)
explain
update public.photos
set liked_by = array_append(liked_by, 'test@example.com'),
    likes = array_length(array_append(liked_by, 'test@example.com'), 1)
where id = 1;

-- ✅ Si tous les résultats s'affichent sans erreur, la table est correctement configurée !
