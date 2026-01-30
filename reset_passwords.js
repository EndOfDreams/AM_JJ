const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

// IMPORTANT: Vous devez ajouter la SERVICE_ROLE key dans votre .env
// Allez sur: https://supabase.com/dashboard/project/sxdgvuqawjehfjexziwu/settings/api
// Copiez la "service_role" key (pas la anon key!)
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
    console.error('❌ ERREUR: Ajoutez SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env');
    console.log('\n📝 Instructions:');
    console.log('1. Allez sur: https://supabase.com/dashboard/project/sxdgvuqawjehfjexziwu/settings/api');
    console.log('2. Copiez la clé "service_role" (attention: elle est secrète!)');
    console.log('3. Ajoutez dans .env: SUPABASE_SERVICE_ROLE_KEY=votre_cle_ici');
    process.exit(1);
}

// Client admin avec service_role key
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Fonction pour convertir nom en email (identique à supabase.ts)
function nameToEmail(fullName) {
    const sanitized = fullName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s/g, '.');
    return `${sanitized}@wedding.local`;
}

async function resetAllPasswords() {
    console.log('🔄 RÉINITIALISATION DES MOTS DE PASSE\n');

    // Récupérer tous les guests avec leurs mots de passe
    const { data: guests, error: guestsError } = await supabaseAdmin
        .from('guests')
        .select('full_name, password, user_id');

    if (guestsError) {
        console.error('❌ Erreur lors de la récupération des guests:', guestsError);
        return;
    }

    console.log(`📋 ${guests.length} utilisateurs trouvés\n`);

    for (const guest of guests) {
        const email = nameToEmail(guest.full_name);

        console.log(`\n👤 ${guest.full_name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Nouveau mot de passe: ${guest.password}`);
        console.log(`   User ID: ${guest.user_id}`);

        try {
            // Mettre à jour le mot de passe dans Auth
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                guest.user_id,
                { password: guest.password }
            );

            if (error) {
                console.log(`   ❌ ÉCHEC: ${error.message}`);
            } else {
                console.log(`   ✅ Mot de passe mis à jour !`);
            }
        } catch (err) {
            console.log(`   ❌ ERREUR: ${err.message}`);
        }
    }

    console.log('\n\n✨ Terminé ! Testez maintenant la connexion dans votre app.');
}

resetAllPasswords().catch(console.error);
