const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createCamille() {
    const name = 'Camille Peres';
    const email = 'camille.peres@wedding.local';
    const password = 'admin';

    console.log(`👤 Création de ${name}...`);

    // 1. Auth User
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
    });

    let userId;

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('   ⚠️  L\'utilisateur Auth existe déjà. Suppression...');
            // On essaie de supprimer l'ID correspondant via l'email ? Pas possible facilement.
            // On va essayer de le "récupérer" en se connectant comme pour Hervé
            const { data: login, error: loginErr } = await supabaseAdmin.auth.signInWithPassword({ email, password });
            if (loginErr) {
                console.log(`   ❌ Impossible de se connecter/récupérer (Erreur: ${loginErr.message})`);
                console.log('   👉 Vous devez SUPPRIMER Camille Peres dans le Dashboard Supabase avant de relancer.');
                return;
            }
            userId = login.user.id;
            console.log(`   🔄 Récupéré via connexion ! ID: ${userId}`);
        } else {
            console.log(`   ❌ Erreur création Auth: ${error.message}`);
            return;
        }
    } else {
        userId = data.user.id;
        console.log(`   ✅ Utilisateur Auth créé ! ID: ${userId}`);
    }

    // 2. Guest Profile
    // D'abord on supprime s'il existe une vieille entrée
    await supabaseAdmin.from('guests').delete().eq('user_id', userId);

    const { error: guestError } = await supabaseAdmin.from('guests').insert({
        user_id: userId,
        full_name: name,
        password: password
    });

    if (guestError) {
        console.log(`   ❌ Erreur profil Guest: ${guestError.message}`);
    } else {
        console.log(`   ✅ Profil Guest créé et lié !`);
        console.log(`   🎉 COMPTE PRÊT : ${name} / ${password}`);
    }
}

createCamille();
