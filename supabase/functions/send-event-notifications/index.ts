import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PlanningEvent {
  id: number;
  time: string;
  title: string;
  description: string;
}

/**
 * Parse "14:30" ou "14h30" → {hours, minutes}
 */
function parseEventTime(timeStr: string): { hours: number; minutes: number } | null {
  const normalized = timeStr.toLowerCase().replace('h', ':').trim();
  const [hStr, mStr] = normalized.split(':');

  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return null;
  return { hours, minutes };
}

/**
 * Vérifie si un événement nécessite une notification MAINTENANT (15 min avant)
 */
function shouldNotifyForEvent(event: PlanningEvent, now: Date): boolean {
  const eventTime = parseEventTime(event.time);
  if (!eventTime) return false;

  // Créer la date de l'événement pour aujourd'hui
  const eventDate = new Date(now);
  eventDate.setHours(eventTime.hours, eventTime.minutes, 0, 0);

  // Si l'événement est déjà passé, ignorer
  if (eventDate < now) return false;

  // Heure de notification = 15 minutes avant
  const notifTime = new Date(eventDate.getTime() - 15 * 60 * 1000);

  // Vérifier si on est dans une fenêtre de 1 minute
  const timeDiff = Math.abs(now.getTime() - notifTime.getTime());
  return timeDiff < 60 * 1000;
}

/**
 * Envoyer via l'API Expo Push
 */
async function sendExpoPushNotifications(messages: any[]) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo Push API error: ${response.status}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  try {
    console.log('[Notif] Function triggered:', new Date().toISOString());

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();

    // 1. Récupérer tous les événements
    const { data: events, error: eventsError } = await supabase
      .from('PlanningEvent')
      .select('*')
      .order('order', { ascending: true });

    if (eventsError) throw eventsError;
    if (!events?.length) {
      return new Response(JSON.stringify({ message: 'No events' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Filtrer les événements nécessitant une notification
    const eventsToNotify = events.filter(e => shouldNotifyForEvent(e, now));

    if (!eventsToNotify.length) {
      console.log('[Notif] No events to notify');
      return new Response(JSON.stringify({ message: 'No events to notify' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Notif] Notifying for: ${eventsToNotify.map(e => e.title).join(', ')}`);

    // 3. Récupérer les tokens actifs (depuis la table guests)
    const { data: guests, error: tokensError } = await supabase
      .from('guests')
      .select('push_token, user_id, full_name')
      .not('push_token', 'is', null);

    if (tokensError) throw tokensError;
    if (!guests?.length) {
      console.log('[Notif] No active tokens');
      return new Response(JSON.stringify({ message: 'No tokens' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Construire les messages
    const messages = [];
    for (const event of eventsToNotify) {
      for (const guest of guests) {
        messages.push({
          to: guest.push_token,
          title: `💒 ${event.title}`,
          body: event.description
            ? `Dans 15 minutes — ${event.description}`
            : `Dans 15 minutes — Préparez-vous !`,
          data: {
            screen: 'planning',
            eventId: String(event.id),
          },
          sound: 'default',
          priority: 'high',
        });
      }
    }

    // 5. Envoyer via Expo
    const result = await sendExpoPushNotifications(messages);
    const tickets = result.data || [];

    // 6. Marquer les tokens invalides comme inactifs
    const invalidTokens = [];
    tickets.forEach((ticket: any, i: number) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        invalidTokens.push(messages[i].to);
      }
    });

    if (invalidTokens.length > 0) {
      await supabase
        .from('guests')
        .update({ push_token: null })
        .in('push_token', invalidTokens);
    }

    // 7. Logger les envois (optionnel)
    for (const event of eventsToNotify) {
      await supabase.from('notifications_log').insert({
        event_id: event.id,
        event_title: event.title,
        event_time: event.time,
        recipient_count: guests.length,
        success_count: tickets.filter((t: any) => t.status === 'ok').length,
        error_count: tickets.filter((t: any) => t.status === 'error').length,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsNotified: eventsToNotify.map(e => e.title),
        messagesSent: messages.length,
        invalidTokens: invalidTokens.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Notif] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
