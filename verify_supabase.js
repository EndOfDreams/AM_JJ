const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sxdgvuqawjehfjexziwu.supabase.co';
const supabaseKey = 'sb_secret_5yldm3f1-z4KjYswFC4VyQ_F6fED9Dm';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    try {
        // Try to list storage buckets as a connectivity test
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error connecting (Storage):', error.message);
            // If storage fails, it might be permissions.
        } else {
            console.log('Connection successful! Buckets found:', data.length);
            if (data.length > 0) {
                console.log('Buckets:', data.map(b => b.name));
            }
        }

    } catch (err) {
        console.error('Exception during connection test:', err);
    }
}

testConnection();
