const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Données des invités avec leurs mots de passe
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

async function recreateGuests() {
    console.log('🔄 RECRÉATION DES GUESTS\n');

    for (const guestData of guestsData) {
        const email = nameToEmail(guestData.full_name);

        console.log(`\n👤 ${guestData.full_name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${guestData.password}`);

        try {
            // Essayer de se connecter pour obtenir l'user_id
            console.log(`   🔐 Tentative de connexion...`);
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: guestData.password,
            });

            if (authError) {
                console.log(`   ❌ Connexion échouée: ${authError.message}`);
                console.log(`   ℹ️  Cet utilisateur n'existe pas dans Auth ou le mot de passe est incorrect`);
                continue;
            }

            const userId = authData.user.id;
            console.log(`   ✅ Connecté ! User ID: ${userId}`);

            // Déconnexion
            await supabase.auth.signOut();

            // Créer l'entrée dans guests
            console.log(`   ➕ Création de l'entrée guest...`);
            const { error: insertError } = await supabase
                .from('guests')
                .insert({
                    user_id: userId,
                    full_name: guestData.full_name,
                    password: guestData.password,
                });

            if (insertError) {
                console.log(`   ❌ ÉCHEC insertion: ${insertError.message}`);
            } else {
                console.log(`   ✅ Guest créé avec succès !`);
            }

        } catch (err) {
            console.log(`   ❌ ERREUR: ${err.message}`);
        }
    }

    console.log('\n\n✨ TERMINÉ ! Testez maintenant la connexion dans votre app.\n');
}

recreateGuests().catch(console.error);
