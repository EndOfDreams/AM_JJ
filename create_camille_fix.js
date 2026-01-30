const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createCamilleFix() {
    const name = 'Camille Peres';
    const email = 'camille.peres.fix@wedding.local'; // EMAIL DIFFÉRENT POUR CONTOURNER LE BUG
    const password = 'admin';

    console.log(`👤 Création du compte de remplacement pour ${name}...`);

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
            console.log('   ⚠️  Le compte fix existe déjà. Récupération...');
            const { data: login } = await supabaseAdmin.auth.signInWithPassword({ email, password });
            userId = login.user.id;
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
        console.log(`   ✅ Profil Guest (Fix) créé et lié !`);
        console.log(`   🎉 COMPTE RÉPARÉ (interne) : ${email}`);
    }
}

createCamilleFix();
