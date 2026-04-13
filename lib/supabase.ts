import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { loginSchema, photoSchema } from './validation';

// Configuration Supabase depuis variables d'environnement
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || '';

if (__DEV__) {
  console.log('[Supabase] Initializing with URL:', SUPABASE_URL);
  console.log('[Supabase] Key length:', SUPABASE_ANON_KEY?.length);
  console.log('[Supabase] Key starts with:', SUPABASE_ANON_KEY?.substring(0, 15));
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auto-refresh session when app returns to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});



export async function uploadMedia(
  uri: string,
  type: 'photo' | 'video'
): Promise<string> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const fileExt = type === 'photo' ? 'jpg' : 'mp4';
  const fileName = `wedding-${timestamp}-${randomSuffix}.${fileExt}`;
  const filePath = `${type}s/${fileName}`;
  const contentType = type === 'photo' ? 'image/jpeg' : 'video/mp4';

  // FileSystem.uploadAsync = upload binaire natif iOS/Android.
  // Évite le bug React Native où fetch + ArrayBuffer retourne du HTML depuis le CDN Supabase.
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/wedding-media/${filePath}`;
  const response = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': contentType,
      'cache-control': '3600',
    },
  });

  if (response.status !== 200) {
    if (__DEV__) console.error('[Storage] Upload error:', response.status, response.body);
    throw new Error(`Upload failed: ${response.status}`);
  }

  const { data: publicData } = supabase.storage
    .from('wedding-media')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}



export async function createPhotoEntry(
  imageUrl: string,
  mediaType: 'photo' | 'video',
  createdBy: string,
  caption?: string
): Promise<string | null> {
  try {
    // Validation des données
    const validatedData = photoSchema.parse({
      image_url: imageUrl,
      media_type: mediaType,
      created_by: createdBy,
      caption: caption || undefined,
    });

    const { data, error } = await supabase.from('photos').insert({
      image_url: validatedData.image_url,
      media_type: validatedData.media_type,
      likes: 0,
      created_by: validatedData.created_by,
      ...(validatedData.caption ? { caption: validatedData.caption } : {}),
    }).select('id').single();

    if (error) throw error;
    return data?.id as string ?? null;
  } catch (error) {
    if (__DEV__) console.error('[Photo] Create entry error:', error);
    throw error;
  }
}

export async function fetchPhotos(page = 0, pageSize = 30) {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Fetch all guests first to build a map
    const { data: guests } = await supabase
      .from('guests')
      .select('full_name, gender');

    const genderMap = new Map(guests?.map(g => [g.full_name, g.gender]) || []);

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Enrich photos with gender from the map
    const photosWithGender = (data || []).map((photo) => ({
      ...photo,
      gender: photo.created_by ? genderMap.get(photo.created_by) || 'H' : 'H'
    }));

    return photosWithGender || [];
  } catch (error) {
    if (__DEV__) console.error('[Photo] Fetch error:', error);
    return [];
  }
}

export async function togglePhotoLike(
  photoId: string,
  userEmail: string,
) {
  try {
    const { data, error } = await supabase.rpc('toggle_like', {
      photo_id_input: photoId,
      p_user_email: userEmail,
    });

    if (error) throw error;
    return data as { likes: number; action: 'liked' | 'unliked' };
  } catch (error) {
    if (__DEV__) console.error('[Photo] Toggle like error:', error);
    throw error;
  }
}

export async function fetchUserLikes(userEmail: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase.rpc('get_user_likes', {
      p_user_email: userEmail,
    });

    if (error) throw error;
    return new Set((data || []).map((id: number) => String(id)));
  } catch (error) {
    if (__DEV__) console.error('[Photo] Fetch user likes error:', error);
    return new Set();
  }
}

/**
 * Convertit un nom complet en email fictif pour Supabase Auth
 * IMPORTANT : Cette fonction doit correspondre EXACTEMENT à la façon dont 
 * les emails ont été créés dans Supabase Auth
 * 
 * Logique : garde les tirets, remplace les espaces par des points
 * Ex: "Anne-Marie Cabanac" -> "anne-marie.cabanac@wedding.local"
 * Ex: "Jean Dupont" -> "jean.dupont@wedding.local"
 */
function nameToEmail(fullName: string): string {
  // Convertir en minuscules et supprimer les espaces au début/fin
  const sanitized = fullName
    .toLowerCase()
    .trim()
    // Supprimer les accents (é → e, à → a, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remplacer les espaces multiples par un seul espace
    .replace(/\s+/g, ' ')
    // Remplacer les espaces par des points
    .replace(/\s/g, '.');

  const email = `${sanitized}@wedding.local`;

  return email;
}

/**
 * Authentification sécurisée via Supabase Auth
 * Utilise bcrypt automatiquement pour le hashing des mots de passe
 * 
 * L'utilisateur entre son nom complet EXACTEMENT comme enregistré
 * (y compris les tirets pour les prénoms composés)
 * Ex: "Anne-Marie Cabanac" (avec le tiret)
 */
export async function signIn(name: string, password: string) {
  try {
    // Validation des entrées
    const validatedInput = loginSchema.parse({ name, password });

    // Convertir le nom en email fictif
    const email = nameToEmail(validatedInput.name);

    if (__DEV__) console.log('[Auth] Attempting login with email:', email);

    // Ensure any previous session is cleared before a fresh login
    await supabase.auth.signOut().catch(() => {});

    // Authentification via Supabase Auth (sécurisé avec bcrypt)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: validatedInput.password,
    });

    if (error) {
      if (__DEV__) console.log('[Auth] Login failed:', error.message, '| Status:', error.status, '| Email used:', email);
      throw new Error('Utilisateur inconnu ou mot de passe incorrect.');
    }

    if (!data.user) {
      throw new Error('Erreur d\'authentification.');
    }

    // Tenter de récupérer les informations du profil guest
    // Si ça échoue (ex: erreur RLS), on continue quand même pour ne pas bloquer l'utilisateur
    let guestData = null;
    try {
      const { data: profile, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (!guestError && profile) {
        guestData = profile;
      } else {
        if (__DEV__) console.log('[Auth] Guest fetch failed/empty, using fallback');
      }
    } catch (e) {
      // Ignorer les erreurs de requêtes ici
      if (__DEV__) console.warn('[Auth] Guest fetch exception ignored');
    }

    // Si pas de guestData, on simule un profil minimal pour débloquer l'app
    if (!guestData) {
      guestData = {
        id: 'temp-id', // ID temporaire
        user_id: data.user.id,
        full_name: validatedInput.name,
        // Autres champs par défaut si nécessaire
      };
    }

    if (__DEV__) console.log('[Auth] Login successful');

    // Retourner les données du guest avec l'email
    return {
      ...guestData,
      email: data.user.email
    };

  } catch (err: any) {
    // Ne pas logger les erreurs sensibles en production
    if (__DEV__) console.error('[Auth] Error:', err);
    throw err;
  }
}

/**
 * Déconnexion sécurisée
 */
export async function signOut() {
  try {
    // NEW: Remove push token before logout
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { removePushToken } = await import('./notifications');
      await removePushToken(user.id).catch(err => {
        if (__DEV__) console.warn('[Auth] Failed to remove token:', err);
      });
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (__DEV__) console.log('[Auth] Logout successful');
  } catch (error) {
    if (__DEV__) console.error('[Auth] Logout error:', error);
    throw error;
  }
}

/**
 * Récupérer la session actuelle
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    if (__DEV__) console.error('[Auth] Session error:', error);
    return null;
  }
}

/**
 * Récupérer l'utilisateur actuellement connecté
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (!user) return null;

    // Récupérer le profil guest associé
    const { data: guestData } = await supabase
      .from('guests')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return guestData;
  } catch (error) {
    if (__DEV__) console.error('[Auth] Get user error:', error);
    return null;
  }
}

/**
 * STORE_COMPLIANCE: Account deletion - Required by Apple App Store since June 2022
 * Supprime complètement les données utilisateur via Edge Function
 *
 * Cette fonction appelle une Edge Function qui utilise le service role pour:
 * 1. Anonymiser les photos créées
 * 2. Retirer les likes de l'utilisateur
 * 3. Supprimer le profil guest
 * 4. Supprimer le compte Auth (nécessite service role)
 */
export async function deleteAccount(userEmail: string): Promise<void> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Utilisateur non connecté');
    }

    if (__DEV__) console.log('[Auth] Starting complete account deletion via Edge Function');

    // Call Edge Function with user's auth token
    const { data, error } = await supabase.functions.invoke('delete-user-account', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      if (__DEV__) console.error('[Auth] Edge Function error:', error);
      throw new Error('Erreur lors de la suppression du compte');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Échec de la suppression du compte');
    }

    if (__DEV__) console.log('[Auth] Complete account deletion successful');

    // Note: No need to call signOut() - the user will be auto-logged out
    // since their auth account no longer exists

  } catch (error) {
    if (__DEV__) console.error('[Auth] Delete account error:', error);
    throw new Error('Erreur lors de la suppression du compte. Veuillez réessayer.');
  }
}

/**
 * Supprimer une photo (base de données + storage)
 * Seul le créateur de la photo peut la supprimer
 */
export async function deletePhoto(
  photoId: string,
  imageUrl: string,
  currentUserName: string,
  photoCreatedBy: string
): Promise<void> {
  try {
    // Vérification côté client que l'utilisateur est bien le créateur
    if (currentUserName !== photoCreatedBy) {
      throw new Error('Vous ne pouvez supprimer que vos propres photos');
    }

    // Extraire le chemin du fichier depuis l'URL publique
    // Format: https://.../storage/v1/object/public/wedding-media/photos/wedding-xxx.jpg
    const storagePathMatch = imageUrl.match(/wedding-media\/(.+)$/);
    if (storagePathMatch) {
      const filePath = storagePathMatch[1];
      const { error: storageError } = await supabase.storage
        .from('wedding-media')
        .remove([filePath]);

      if (storageError) {
        if (__DEV__) console.warn('[Photo] Storage delete error (non-blocking):', storageError);
      }
    }

    // Supprimer l'entrée de la base de données
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;

    if (__DEV__) console.log('[Photo] Deleted successfully:', photoId);
  } catch (error) {
    if (__DEV__) console.error('[Photo] Delete error:', error);
    throw error;
  }
}

// --- Content Moderation (STORE COMPLIANCE) ---

/**
 * Signaler un contenu inapproprié
 * STORE COMPLIANCE: Required for UGC moderation
 */
export async function reportContent(
  photoId: string,
  reason: string,
  reporterName?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Vous devez être connecté pour signaler un contenu');
    }

    const { error } = await supabase.from('reports').insert({
      photo_id: photoId,
      reported_by: user.id,
      reporter_name: reporterName || 'Utilisateur anonyme',
      reason: reason,
      status: 'pending'
    });

    if (error) throw error;

    if (__DEV__) console.log('[Moderation] Content reported:', photoId);
  } catch (error) {
    if (__DEV__) console.error('[Moderation] Report error:', error);
    throw new Error('Erreur lors du signalement. Veuillez réessayer.');
  }
}

// --- Comments ---

export type Comment = {
  id: number;
  photo_id: string;
  created_by: string;
  content: string;
  created_at: string;
};

export async function fetchComments(photoId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('[Comments] Fetch error:', error);
    return [];
  }
}

export async function addComment(photoId: string, createdBy: string, content: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ photo_id: photoId, created_by: createdBy, content: content.trim() })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('[Comments] Add error:', error);
    throw error;
  }
}

export async function deleteComment(commentId: number): Promise<void> {
  try {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  } catch (error) {
    if (__DEV__) console.error('[Comments] Delete error:', error);
    throw error;
  }
}

export async function fetchGuests(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('guests').select('full_name');
    if (error) throw error;
    return (data || []).map((g: { full_name: string }) => g.full_name);
  } catch (error) {
    if (__DEV__) console.error('[Guests] Fetch error:', error);
    return [];
  }
}

// --- Gender management ---

export async function updateGuestGender(userId: string, gender: 'H' | 'F' | 'MA' | 'FA'): Promise<void> {
  try {
    const { error } = await supabase
      .from('guests')
      .update({ gender })
      .eq('user_id', userId);

    if (error) throw error;
    if (__DEV__) console.log('[Guest] Gender updated:', userId, gender);
  } catch (error) {
    if (__DEV__) console.error('[Guest] Gender update error:', error);
    throw error;
  }
}

export async function fetchGuestGender(fullName: string): Promise<'H' | 'F' | 'MA' | 'FA' | undefined> {
  try {
    const { data } = await supabase
      .from('guests')
      .select('gender')
      .eq('full_name', fullName)
      .single();

    return data?.gender || undefined;
  } catch (error) {
    if (__DEV__) console.warn('[Guest] Gender fetch failed, using default:', fullName);
    return undefined;
  }
}