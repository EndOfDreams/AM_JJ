-- Script de test pour vérifier le fonctionnement des likes multi-utilisateurs

-- 1. Afficher toutes les photos avec leurs likes
select 
  id,
  media_type,
  likes,
  liked_by,
  created_at,
  created_by
from public.photos
order by created_at desc;

-- 2. Tester l'ajout d'un like pour un utilisateur
-- Remplacez 1 par l'ID d'une photo existante
do $$
declare
  photo_id bigint := 1;
  user_email text := 'test1@example.com';
  current_liked_by text[];
  new_liked_by text[];
begin
  -- Récupérer le tableau actuel
  select liked_by into current_liked_by from public.photos where id = photo_id;
  
  -- Ajouter l'utilisateur s'il n'est pas déjà présent
  if not (user_email = any(current_liked_by)) then
    new_liked_by := array_append(current_liked_by, user_email);
    
    update public.photos
    set liked_by = new_liked_by,
        likes = array_length(new_liked_by, 1)
    where id = photo_id;
    
    raise notice 'Like ajouté pour % sur la photo %', user_email, photo_id;
  else
    raise notice 'L''utilisateur % a déjà liké la photo %', user_email, photo_id;
  end if;
end $$;

-- 3. Tester l'ajout d'un deuxième like par un autre utilisateur
do $$
declare
  photo_id bigint := 1;
  user_email text := 'test2@example.com';
  current_liked_by text[];
  new_liked_by text[];
begin
  select liked_by into current_liked_by from public.photos where id = photo_id;
  
  if not (user_email = any(current_liked_by)) then
    new_liked_by := array_append(current_liked_by, user_email);
    
    update public.photos
    set liked_by = new_liked_by,
        likes = array_length(new_liked_by, 1)
    where id = photo_id;
    
    raise notice 'Like ajouté pour % sur la photo %', user_email, photo_id;
  else
    raise notice 'L''utilisateur % a déjà liké la photo %', user_email, photo_id;
  end if;
end $$;

-- 4. Vérifier le résultat : la photo devrait avoir 2 likes
select 
  id,
  likes,
  liked_by,
  array_length(liked_by, 1) as nombre_utilisateurs_qui_ont_like
from public.photos
where id = 1;

-- 5. Tester le retrait d'un like
do $$
declare
  photo_id bigint := 1;
  user_email text := 'test1@example.com';
  current_liked_by text[];
  new_liked_by text[];
begin
  select liked_by into current_liked_by from public.photos where id = photo_id;
  
  if user_email = any(current_liked_by) then
    new_liked_by := array_remove(current_liked_by, user_email);
    
    update public.photos
    set liked_by = new_liked_by,
        likes = coalesce(array_length(new_liked_by, 1), 0)
    where id = photo_id;
    
    raise notice 'Like retiré pour % sur la photo %', user_email, photo_id;
  else
    raise notice 'L''utilisateur % n''a pas liké la photo %', user_email, photo_id;
  end if;
end $$;

-- 6. Vérifier le résultat final : la photo devrait avoir 1 like (test2@example.com)
select 
  id,
  likes,
  liked_by,
  array_length(liked_by, 1) as nombre_utilisateurs_qui_ont_like
from public.photos
where id = 1;

-- 7. Nettoyer les données de test
update public.photos
set liked_by = '{}',
    likes = 0
where id = 1;

-- 8. Statistiques globales
select 
  count(*) as total_photos,
  sum(likes) as total_likes,
  avg(likes) as moyenne_likes_par_photo,
  max(likes) as max_likes_sur_une_photo
from public.photos;

-- 9. Photos les plus likées
select 
  id,
  media_type,
  likes,
  liked_by,
  created_at
from public.photos
where likes > 0
order by likes desc
limit 10;
