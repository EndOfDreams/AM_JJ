const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Données complètes des invités
const guestsData = [
    { full_name: 'Camille Peres', password: 'admin' },
    { full_name: 'Jean Dupont', password: '123456' },
    { full_name: 'Anne-Marie Cabanac', password: 'password' },
    { full_name: 'hervé', password: 'pass' },
    { full_name: 'marie', password: 'marie' },
    { full_name: 'Jijii', password: 'love' },
    { full_name: 'alounny', password: 'alounny' },
];

function nameToEmail(fullName) {
    const sanitized = fullName
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s/g, '.');
    return `${sanitized}@wedding.local`;
}

async function setupEverything() {
    console.log('🚀 CONFIGURATION COMPLÈTE DE L\'AUTHENTIFICATION\n');
    console.log('='.repeat(60) + '\n');

    for (const guestData of guestsData) {
        const email = nameToEmail(guestData.full_name);

        console.log(`\n👤 ${guestData.full_name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${guestData.password}`);

        try {
            // Créer l'utilisateur dans Auth (ou utiliser l'existant)
            console.log(`   ➕ Création utilisateur Auth...`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: guestData.password,
                email_confirm: true,
                user_metadata: {
                    full_name: guestData.full_name
                }
            });

            let userId;

            if (createError) {
                console.log(`   ⚠️  Erreur création: ${createError.message}`);
                console.log(`   🔄 Tentative de récupération via connexion...`);

                // Essayer de se connecter pour obtenir l'ID
                const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
                    email: email,
                    password: guestData.password,
                });

                if (signInError) {
                    console.log(`   ❌ Connexion impossible: ${signInError.message}`);
                    console.log(`   --> Impossible de récupérer l'ID pour cet utilisateur.`);
                    continue;
                }

                userId = signInData.user.id;
                console.log(`   ✅ Utilisateur récupéré ! ID: ${userId}`);

                // Déconnexion propre
                await supabaseAdmin.auth.signOut();

            } else {
                userId = newUser.user.id;
                console.log(`   ✅ Utilisateur Auth créé !`);
            }

            console.log(`   ID: ${userId}`);

            // Créer l'entrée dans guests
            console.log(`   ➕ Création entrée guests...`);
            const { error: insertError } = await supabaseAdmin
                .from('guests')
                .insert({
                    user_id: userId,
                    full_name: guestData.full_name,
                    password: guestData.password,
                });

            if (insertError) {
                console.log(`   ❌ ÉCHEC insertion guests: ${insertError.message}`);
            } else {
                console.log(`   ✅ Guest créé avec succès !`);
            }

        } catch (err) {
            console.log(`   ❌ ERREUR: ${err.message}`);
        }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✨ CONFIGURATION TERMINÉE !');
    console.log('🧪 Testez maintenant la connexion dans votre app.\n');
}

setupEverything().catch(console.error);
