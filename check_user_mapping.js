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

function nameToEmail(fullName) {
    const sanitized = fullName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s/g, '.');
    return `${sanitized}@wedding.local`;
}

async function checkUserMapping() {
    console.log('🔍 VÉRIFICATION DES CORRESPONDANCES\n');

    // Récupérer tous les utilisateurs Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
        console.error('❌ Erreur Auth:', authError);
        return;
    }

    console.log(`📋 ${authUsers.users.length} utilisateurs dans Auth:\n`);

    authUsers.users.forEach(user => {
        console.log(`   ${user.email} → ID: ${user.id}`);
    });

    // Récupérer tous les guests
    const { data: guests, error: guestsError } = await supabaseAdmin
        .from('guests')
        .select('*');

    if (guestsError) {
        console.error('❌ Erreur Guests:', guestsError);
        return;
    }

    console.log(`\n📋 ${guests.length} utilisateurs dans table guests:\n`);

    for (const guest of guests) {
        const email = nameToEmail(guest.full_name);
        const authUser = authUsers.users.find(u => u.email === email);

        console.log(`\n👤 ${guest.full_name}`);
        console.log(`   Email généré: ${email}`);
        console.log(`   UUID dans guests: ${guest.user_id}`);

        if (authUser) {
            console.log(`   UUID dans Auth:   ${authUser.id}`);
            if (guest.user_id === authUser.id) {
                console.log(`   ✅ MATCH !`);
            } else {
                console.log(`   ❌ PAS DE CORRESPONDANCE !`);
                console.log(`   → Il faut mettre à jour l'UUID dans la table guests`);
            }
        } else {
            console.log(`   ❌ Utilisateur n'existe PAS dans Auth !`);
            console.log(`   → Il faut créer cet utilisateur dans Auth`);
        }
    }
}

checkUserMapping().catch(console.error);
