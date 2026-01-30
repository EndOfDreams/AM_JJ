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

async function cleanAllData() {
    console.log('🧹 NETTOYAGE DES DONNÉES\n');

    // 1. Photos (pourrait avoir des liens vers Users)
    console.log('🗑️  Suppression des photos...');
    const { error: photoError } = await supabaseAdmin
        .from('photos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (photoError) console.log(`   ❌ Erreur: ${photoError.message}`);
    else console.log('   ✅ Photos supprimées');

    // 2. Planning
    console.log('🗑️  Suppression du planning...');
    const { error: planningError } = await supabaseAdmin
        .from('planning_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (planningError) console.log(`   ❌ Erreur: ${planningError.message}`);
    else console.log('   ✅ Planning supprimé');

    // 3. Guests
    console.log('🗑️  Suppression des guests...');
    const { error: guestError } = await supabaseAdmin
        .from('guests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (guestError) console.log(`   ❌ Erreur: ${guestError.message}`);
    else console.log('   ✅ Guests supprimés');

    console.log('\n✨ Nettoyage terminé.');
}

cleanAllData().catch(console.error);
