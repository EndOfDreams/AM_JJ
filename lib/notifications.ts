import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// --- Types ---

interface PlanningEvent {
    id: number;
    time: string;      // "HH:MM" or "HHhMM"
    title: string;
    description: string;
    started: boolean;
    order: number;
}

// --- Android Notification Channel ---

export async function setupNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('wedding-events', {
        name: 'Événements du mariage',
        description: 'Rappels 15 minutes avant chaque événement',
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
        }),
    });
}

// --- Permission ---

export async function requestNotificationPermission(): Promise<boolean> {
    if (!Device.isDevice) {
        if (__DEV__) console.log('[Notif] Skipping — not a physical device');
        return false;
    }

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
        return false;
    }

    if (__DEV__) console.log('[Notif] Permission granted');
    return true;
}

// --- Parse event time string to Date ---

function parseEventTimeToDate(timeStr: string): Date | null {
    const normalized = timeStr.toLowerCase().replace('h', ':').trim();
    const parts = normalized.split(':');
    if (parts.length < 2) return null;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return null;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// --- Schedule All Event Notifications ---

export async function scheduleEventNotifications(events: PlanningEvent[]): Promise<void> {
    try {
        // Cancel all previously scheduled notifications to avoid duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        const now = new Date();
        let scheduledCount = 0;

        for (const event of events) {
            if (!event.time) continue;

            const eventDate = parseEventTimeToDate(event.time);
            if (!eventDate) continue;

            // Notification 15 minutes before
            const notifDate = new Date(eventDate.getTime() - 15 * 60 * 1000);

            // Skip if notification time is already past
            if (notifDate <= now) continue;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `💒 ${event.title}`,
                    body: event.description
                        ? `Dans 15 minutes — ${event.description}`
                        : `Dans 15 minutes — Préparez-vous !`,
                    data: { screen: 'planning', eventId: String(event.id) },
                    sound: 'default',
                    ...(Platform.OS === 'android' && {
                        channelId: 'wedding-events',
                    }),
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: notifDate,
                },
            });

            scheduledCount++;
            if (__DEV__) {
                console.log(
                    `[Notif] Scheduled: "${event.title}" at ${notifDate.toLocaleTimeString()}`
                );
            }
        }

        if (__DEV__) {
            const all = await Notifications.getAllScheduledNotificationsAsync();
            console.log(`[Notif] Total scheduled: ${all.length} (${scheduledCount} new)`);
        }
    } catch (error) {
        if (__DEV__) console.error('[Notif] Scheduling error:', error);
    }
}
