const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function verifyFix() {
    console.log('🧪 TEST DE CONNEXION POUR CAMILLE (FIX)\n');

    const email = 'camille.peres.fix@wedding.local';
    const password = 'admin';

    console.log(`Tentative avec : ${email} / ${password} ...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.log(`❌ ÉCHEC : ${error.message}`);
    } else {
        console.log(`✅ SUCCÈS ! (ID: ${data.user.id})`);

        // Vérifier le profil guest
        const { data: guest, error: gError } = await supabase
            .from('guests')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (gError) console.log(`⚠️  Profil Guest non trouvé : ${gError.message}`);
        else console.log(`✅ Profil Guest OK : ${guest.full_name}`);
    }
}

verifyFix();
