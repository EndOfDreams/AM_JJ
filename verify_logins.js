const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

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

async function verifyLogins() {
    console.log('🧪 VÉRIFICATION FINALE DES CONNEXIONS\n');

    const users = [
        { name: 'Camille Peres', pass: 'admin' },
        { name: 'Jean Dupont', pass: '123456' },
        { name: 'hervé', pass: 'pass' },
        { name: 'alounny', pass: 'alounny' }
    ];

    for (const u of users) {
        const email = nameToEmail(u.name);
        console.log(`👤 ${u.name}`);
        console.log(`   Email: ${email}`);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: u.pass,
            });

            if (error) {
                console.log(`   ❌ Échec connexion: ${error.message}`);
            } else {
                console.log(`   ✅ Connexion réussie ! (ID: ${data.user.id})`);

                // Vérifier si le profil guest existe
                const { data: guest, error: guestError } = await supabase
                    .from('guests')
                    .select('*')
                    .eq('user_id', data.user.id)
                    .single();

                if (guestError) {
                    console.log(`   ⚠️  Profil guest manquant ou erreur: ${guestError.message}`);
                } else if (!guest) {
                    console.log(`   ⚠️  Pas de profil guest trouvé !`);
                } else {
                    console.log(`   ✅ Profil guest trouvé: ${guest.full_name}`);
                }

                await supabase.auth.signOut();
            }
        } catch (err) {
            console.log(`   ❌ Erreur script: ${err.message}`);
        }
        console.log('');
    }
}

verifyLogins().catch(console.error);
