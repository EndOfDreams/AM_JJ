import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: Delete User Account
 * Purpose: STORE COMPLIANCE - Complete account deletion including Auth user
 *
 * This function performs a complete deletion that requires service role permissions:
 * 1. Remove user from guests table
 * 2. Anonymize user's photos (replace name with "Utilisateur supprimé")
 * 3. Remove user's likes from all photos
 * 4. Delete the Auth user account (requires service role)
 *
 * Trigger: Called from client app when user clicks "Delete Account"
 */

Deno.serve(async (req) => {
  try {
    console.log('[DeleteAccount] Function triggered');

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create regular client to verify user identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('[DeleteAccount] User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('[DeleteAccount] Deleting account for user:', userId);

    // Step 1: Anonymize user's photos (replace name with "Utilisateur supprimé")
    console.log('[DeleteAccount] Anonymizing photos...');
    const { error: anonymizeError } = await supabaseAdmin
      .from('photos')
      .update({ created_by: 'Utilisateur supprimé' })
      .eq('created_by', user.email);

    if (anonymizeError) {
      console.error('[DeleteAccount] Failed to anonymize photos:', anonymizeError);
      throw new Error('Failed to anonymize photos');
    }

    // Step 2: Remove user's likes from all photos
    console.log('[DeleteAccount] Removing likes...');
    const { data: likedPhotos, error: fetchLikesError } = await supabaseAdmin
      .from('photos')
      .select('id, liked_by')
      .contains('liked_by', [user.email]);

    if (fetchLikesError) {
      console.error('[DeleteAccount] Failed to fetch liked photos:', fetchLikesError);
      throw new Error('Failed to fetch liked photos');
    }

    if (likedPhotos && likedPhotos.length > 0) {
      for (const photo of likedPhotos) {
        const updatedLikes = photo.liked_by.filter((email: string) => email !== user.email);
        const newLikesCount = updatedLikes.length;

        const { error: updateLikesError } = await supabaseAdmin
          .from('photos')
          .update({
            liked_by: updatedLikes,
            likes: newLikesCount
          })
          .eq('id', photo.id);

        if (updateLikesError) {
          console.error('[DeleteAccount] Failed to update likes for photo:', photo.id, updateLikesError);
        }
      }
    }

    // Step 3: Remove user from guests table
    console.log('[DeleteAccount] Removing guest record...');
    const { error: guestDeleteError } = await supabaseAdmin
      .from('guests')
      .delete()
      .eq('user_id', userId);

    if (guestDeleteError) {
      console.error('[DeleteAccount] Failed to delete guest:', guestDeleteError);
      throw new Error('Failed to delete guest record');
    }

    // Step 4: Delete the Auth user (CRITICAL - requires service role)
    console.log('[DeleteAccount] Deleting Auth user...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('[DeleteAccount] Failed to delete Auth user:', authDeleteError);
      throw new Error('Failed to delete authentication account');
    }

    console.log('[DeleteAccount] Account deletion completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
        deletedUserId: userId
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[DeleteAccount] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
