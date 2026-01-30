-- Vérifier si les user_id dans guests correspondent aux IDs dans auth.users
SELECT 
    g.full_name,
    g.user_id as guest_user_id,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN g.user_id = au.id THEN '✅ MATCH'
        ELSE '❌ NO MATCH'
    END as status
FROM guests g
LEFT JOIN auth.users au ON g.user_id = au.id
ORDER BY g.full_name;

-- Afficher tous les utilisateurs Auth
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY email;
