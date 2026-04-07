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
 * Récupère l'heure actuelle en France (Europe/Paris)
 * Le serveur Deno tourne en UTC, les événements sont en heure française
 */
function getNowInParis(): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  return {
    hours: parseInt(parts.find(p => p.type === 'hour')!.value, 10),
    minutes: parseInt(parts.find(p => p.type === 'minute')!.value, 10),
  };
}

/**
 * Vérifie si un événement nécessite une notification MAINTENANT (15 min avant)
 * Compare en minutes depuis minuit pour éviter les problèmes de timezone
 */
function shouldNotifyForEvent(event: PlanningEvent, nowParis: { hours: number; minutes: number }): boolean {
  const eventTime = parseEventTime(event.time);
  if (!eventTime) return false;

  const eventMinutes = eventTime.hours * 60 + eventTime.minutes;
  const nowMinutes = nowParis.hours * 60 + nowParis.minutes;

  // Si l'événement est déjà passé, ignorer
  if (eventMinutes <= nowMinutes) return false;

  // Notification = 15 minutes avant
  const notifMinutes = eventMinutes - 15;

  // Vérifier si on est exactement à la minute de notification
  return Math.abs(nowMinutes - notifMinutes) === 0;
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

    const nowParis = getNowInParis();
    console.log('[Notif] Current time in Paris:', `${nowParis.hours}:${String(nowParis.minutes).padStart(2, '0')}`);

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
    const eventsToNotify = events.filter(e => shouldNotifyForEvent(e, nowParis));

    if (!eventsToNotify.length) {
      console.log('[Notif] No events to notify');
      return new Response(JSON.stringify({ message: 'No events to notify' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2b. Déduplication : vérifier quels événements ont déjà été notifiés aujourd'hui
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const { data: alreadySent } = await supabase
      .from('notifications_log')
      .select('event_id')
      .gte('sent_at', `${today}T00:00:00.000Z`);

    const alreadySentIds = new Set((alreadySent || []).map((r: any) => r.event_id));
    const eventsToNotifyDeduped = eventsToNotify.filter(e => !alreadySentIds.has(e.id));

    if (!eventsToNotifyDeduped.length) {
      console.log('[Notif] All events already notified today, skipping');
      return new Response(JSON.stringify({ message: 'Already notified today' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Notif] After dedup: ${eventsToNotifyDeduped.map(e => e.title).join(', ')}`);

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
    for (const event of eventsToNotifyDeduped) {
      for (const guest of guests) {
        messages.push({
          to: guest.push_token,
          title: `💒 ${event.title}`,
          body: event.description || undefined,
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
    for (const event of eventsToNotifyDeduped) {
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
        eventsNotified: eventsToNotifyDeduped.map(e => e.title),
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
