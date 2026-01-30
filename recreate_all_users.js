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
        // Supprimer les accents (é → e, à → a, etc.)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s/g, '.');
    return `${sanitized}@wedding.local`;
}

async function recreateAllUsers() {
    console.log('🔄 RECRÉATION COMPLÈTE DES UTILISATEURS\n');

    // 1. Récupérer tous les guests
    const { data: guests, error: guestsError } = await supabaseAdmin
        .from('guests')
        .select('*');

    if (guestsError) {
        console.error('❌ Erreur:', guestsError);
        return;
    }

    console.log(`📋 ${guests.length} utilisateurs à traiter\n`);

    for (const guest of guests) {
        const email = nameToEmail(guest.full_name);

        console.log(`\n👤 ${guest.full_name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${guest.password}`);

        try {
            // Supprimer l'utilisateur s'il existe déjà
            console.log(`   🗑️  Suppression de l'ancien utilisateur...`);
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === email);

            if (existingUser) {
                await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
                console.log(`   ✅ Ancien utilisateur supprimé`);
            }

            // Créer le nouvel utilisateur
            console.log(`   ➕ Création du nouvel utilisateur...`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: guest.password,
                email_confirm: true,
                user_metadata: {
                    full_name: guest.full_name
                }
            });

            if (createError) {
                console.log(`   ❌ ÉCHEC création: ${createError.message}`);
                continue;
            }

            console.log(`   ✅ Utilisateur créé ! ID: ${newUser.user.id}`);

            // Mettre à jour l'UUID dans la table guests
            console.log(`   🔄 Mise à jour de l'UUID dans guests...`);
            const { error: updateError } = await supabaseAdmin
                .from('guests')
                .update({ user_id: newUser.user.id })
                .eq('id', guest.id);

            if (updateError) {
                console.log(`   ❌ ÉCHEC mise à jour: ${updateError.message}`);
            } else {
                console.log(`   ✅ UUID mis à jour dans guests`);
            }

        } catch (err) {
            console.log(`   ❌ ERREUR: ${err.message}`);
        }
    }

    console.log('\n\n✨ TERMINÉ ! Tous les utilisateurs ont été recréés.');
    console.log('🧪 Testez maintenant la connexion dans votre app.\n');
}

recreateAllUsers().catch(console.error);
