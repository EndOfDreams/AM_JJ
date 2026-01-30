const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNOSTIC AUTHENTIFICATION\n');
console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_ANON_KEY?.length);
console.log('Key preview:', SUPABASE_ANON_KEY?.substring(0, 50) + '...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fonction identique à celle du code
function nameToEmail(fullName) {
    const sanitized = fullName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s/g, '.');
    return `${sanitized}@wedding.local`;
}

async function testAuth() {
    // Liste des utilisateurs à tester depuis vos captures d'écran
    const testUsers = [
        { name: 'Camille Peres', password: 'admin' },
        { name: 'Jean Dupont', password: '123456' },
        { name: 'Anne-Marie Cabanac', password: 'password' },
        { name: 'herve', password: 'pass' },
        { name: 'marie', password: 'marie' },
    ];

    console.log('📋 TEST DES UTILISATEURS\n');

    for (const user of testUsers) {
        const email = nameToEmail(user.name);
        console.log(`\n🧪 Test: "${user.name}"`);
        console.log(`   Email généré: ${email}`);
        console.log(`   Password: ${user.password}`);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: user.password,
            });

            if (error) {
                console.log(`   ❌ ÉCHEC: ${error.message}`);
                console.log(`   Code: ${error.status}`);
            } else {
                console.log(`   ✅ SUCCÈS !`);
                console.log(`   User ID: ${data.user.id}`);

                // Déconnexion
                await supabase.auth.signOut();
            }
        } catch (err) {
            console.log(`   ❌ ERREUR: ${err.message}`);
        }
    }

    console.log('\n\n📊 VÉRIFICATION DES UTILISATEURS AUTH\n');

    // Utiliser la service_role key pour lister les users (si disponible)
    // Sinon, on ne peut pas lister avec anon key
    console.log('ℹ️  Pour voir tous les utilisateurs Auth, allez sur:');
    console.log(`   ${SUPABASE_URL.replace('//', '//app.')}/project/_/auth/users`);
}

testAuth().catch(console.error);
