const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createBackup() {
    const email = 'admin@wedding.local';
    const password = 'admin'; // Mot de passe simple
    const name = 'Admin Secours';

    console.log('CRÉATION COMPTE DE SECOURS\n');

    // 1. Créer User Auth
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    let userId;

    if (error) {
        if (error.message.includes('already')) {
            console.log('Le compte existe déjà, récupération...');
            const { data: login } = await supabase.auth.signInWithPassword({ email, password });
            if (login && login.user) userId = login.user.id;
            else {
                console.log('Impossible de se connecter au compte secours.');
                return;
            }
        } else {
            console.log('Erreur création:', error.message);
            return;
        }
    } else {
        userId = data.user.id;
    }

    // 2. Créer profil Guest
    const { error: guestError } = await supabase.from('guests').insert({
        user_id: userId,
        full_name: name,
        password: password
    });

    if (guestError) console.log('Erreur guest:', guestError.message);
    else console.log('✅ Compte créé avec succès !');

    console.log(`\n👉 ID: ${userId}`);
    console.log(`👉 Login: ${name}`);
    console.log(`👉 Pass:  ${password}`);
}

createBackup();
