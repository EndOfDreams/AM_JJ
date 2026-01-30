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

async function deleteAllAuthUsers() {
    console.log('🗑️  SUPPRESSION DE TOUS LES UTILISATEURS AUTH\n');

    try {
        // Récupérer tous les utilisateurs
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error('❌ Erreur:', error.message);
            return;
        }

        console.log(`📋 ${data.users.length} utilisateurs trouvés\n`);

        for (const user of data.users) {
            console.log(`🗑️  Suppression de ${user.email}...`);
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

            if (deleteError) {
                console.log(`   ❌ ÉCHEC: ${deleteError.message}`);
            } else {
                console.log(`   ✅ Supprimé`);
            }
        }

        console.log('\n✅ TOUS LES UTILISATEURS ONT ÉTÉ SUPPRIMÉS');
        console.log('\n🔄 Maintenant lancez: node recreate_all_users.js\n');

    } catch (err) {
        console.error('❌ ERREUR:', err.message);
    }
}

deleteAllAuthUsers().catch(console.error);
