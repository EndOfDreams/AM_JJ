import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// --- Android Notification Channel ---

export async function setupNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('wedding-events', {
        name: 'Événements du mariage',
        description: 'Notifications push du mariage',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EC4899',
        sound: 'default',
    });
}

// --- Foreground Handler ---

export function configureNotificationHandler(): void {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

// --- Push Notifications (Remote) ---

/**
 * Enregistrer le token push avec Supabase
 * Appelé après login réussi
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    // Les notifications ne marchent PAS sur simulateur/émulateur
    if (!Device.isDevice) {
        if (__DEV__) console.log('[Notif] Skipping — not a physical device');
        return null;
    }

    try {
        // Vérifier/demander la permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                },
            });
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            if (__DEV__) console.log('[Notif] Permission denied');
            return null;
        }

        // Récupérer le token Expo Push
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenData.data;

        if (__DEV__) console.log('[Notif] Token:', token);

        // Stocker dans Supabase
        const { supabase } = await import('./supabase');
        const { error } = await supabase
            .from('guests')
            .update({ push_token: token })
            .eq('user_id', userId);

        if (error) {
            if (__DEV__) console.error('[Notif] Failed to save token:', error);
        } else {
            if (__DEV__) console.log('[Notif] Token registered for user:', userId);
        }

        return token;
    } catch (error) {
        if (__DEV__) console.error('[Notif] Registration error:', error);
        return null;
    }
}

/**
 * Envoyer une notification push quand quelqu'un like une photo
 * Fire-and-forget : ne bloque pas le flow du like
 */
export async function sendLikeNotification(
    photoCreatorName: string | undefined,
    likerName: string | null
): Promise<void> {
    try {
        // Pas de notif si données manquantes ou si on like sa propre photo
        if (!photoCreatorName || !likerName || photoCreatorName === likerName) return;

        const { supabase } = await import('./supabase');

        // Récupérer le push_token du créateur de la photo
        const { data: guest, error } = await supabase
            .from('guests')
            .select('push_token')
            .eq('full_name', photoCreatorName)
            .single();

        if (error || !guest?.push_token) {
            if (__DEV__) console.log('[Notif] No token for', photoCreatorName);
            return;
        }

        // Envoyer via Expo Push API
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: guest.push_token,
                title: `❤️ ${likerName}`,
                body: 'a aimé votre photo',
                sound: 'default',
                priority: 'high',
            }),
        });

        if (__DEV__) console.log('[Notif] Like notification sent to', photoCreatorName);
    } catch (err) {
        if (__DEV__) console.warn('[Notif] Like notification error:', err);
    }
}

/**
 * Envoyer une notification push aux personnes mentionnées dans un commentaire
 * Fire-and-forget
 */
export async function sendMentionNotification(
    mentionedNames: string[],
    authorName: string,
    commentContent: string
): Promise<void> {
    if (!mentionedNames.length || !authorName) return;

    try {
        const { supabase } = await import('./supabase');

        // Récupérer les tokens de toutes les personnes mentionnées en une requête
        const { data: guests } = await supabase
            .from('guests')
            .select('full_name, push_token')
            .in('full_name', mentionedNames);

        if (!guests?.length) return;

        const messages = guests
            .filter(g => g.push_token && g.full_name !== authorName)
            .map(g => ({
                to: g.push_token,
                title: `💬 ${authorName} vous a mentionné`,
                body: commentContent.length > 80 ? commentContent.slice(0, 80) + '…' : commentContent,
                sound: 'default',
                priority: 'high',
            }));

        if (!messages.length) return;

        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
        });

        if (__DEV__) console.log('[Notif] Mention notifications sent to', messages.map(m => m.to));
    } catch (err) {
        if (__DEV__) console.warn('[Notif] Mention notification error:', err);
    }
}

/**
 * Supprimer le token push (déconnexion)
 */
export async function removePushToken(userId: string): Promise<void> {
    try {
        const { supabase } = await import('./supabase');
        const { error } = await supabase
            .from('guests')
            .update({ push_token: null })
            .eq('user_id', userId);

        if (error) {
            if (__DEV__) console.error('[Notif] Failed to remove token:', error);
        } else {
            if (__DEV__) console.log('[Notif] Token removed');
        }
    } catch (error) {
        if (__DEV__) console.error('[Notif] Token remove error:', error);
    }
}
