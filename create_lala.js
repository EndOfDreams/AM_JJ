const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createLala() {
    const name = 'lala logo';
    const email = 'lala.logo@wedding.local';
    const password = '8965';

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
            console.log('   ⚠️  L\'utilisateur existe déjà. Récupération...');
            const { data: login } = await supabaseAdmin.auth.signInWithPassword({ email, password });
            if (login?.user) {
                userId = login.user.id;
            } else {
                console.log('Impossible de récupérer l\'ID (mot de passe incorrect ?)');
                return;
            }
        } else {
            console.log(`   ❌ Erreur création Auth: ${error.message}`);
            return;
        }
    } else {
        userId = data.user.id;
        console.log(`   ✅ Utilisateur Auth créé ! ID: ${userId}`);
    }

    // 2. Guest Profile
    // Nettoyage préventif
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

createLala();
