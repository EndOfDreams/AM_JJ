# Guide de Déploiement : Notifications Push Distantes

Ce guide vous accompagne dans la mise en place des notifications push distantes pour l'application AM_JJ.

## ✅ Modifications du Code (Déjà Faites)

Toutes les modifications de code ont été appliquées :
- ✅ [lib/notifications.ts](lib/notifications.ts) - Fonctions `registerForPushNotifications` et `removePushToken`
- ✅ [app/welcome.tsx](app/welcome.tsx) - Enregistrement du token au login
- ✅ [app/_layout.tsx](app/_layout.tsx) - Rafraîchissement du token au retour de l'app
- ✅ [lib/supabase.ts](lib/supabase.ts) - Suppression du token au logout
- ✅ [app.config.js](app.config.js) - Configuration EAS
- ✅ [.env](.env) - Variable `EXPO_PUBLIC_EAS_PROJECT_ID` ajoutée

---

## 📋 Étapes de Déploiement

### Étape 1 : Créer un Compte EAS et Obtenir le Project ID

```bash
# 1. Installer EAS CLI globalement (si pas encore fait)
npm install -g eas-cli

# 2. Se connecter à Expo (créer un compte sur expo.dev si nécessaire)
eas login

# 3. Initialiser EAS dans votre projet
eas init
```

**Important** : Après `eas init`, un **Project ID** sera généré. Il ressemble à ceci :
`a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Action à faire** : Copiez ce Project ID et mettez-le dans votre fichier `.env` :
```
EXPO_PUBLIC_EAS_PROJECT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### Étape 2 : Configurer Supabase

#### 2.1 Exécuter les Migrations SQL

Connectez-vous au **Dashboard Supabase** → **SQL Editor**, puis exécutez les fichiers SQL dans l'ordre :

1. **[001_add_push_token_to_guests.sql](supabase/migrations/001_add_push_token_to_guests.sql)**
   ```sql
   -- Copier-coller le contenu du fichier dans le SQL Editor et exécuter
   ```
   ✅ Ajoute la colonne `push_token` à la table `guests`

2. **[002_create_notifications_log.sql](supabase/migrations/002_create_notifications_log.sql)** (optionnel)
   ```sql
   -- Copier-coller le contenu du fichier dans le SQL Editor et exécuter
   ```
   ✅ Crée la table `notifications_log` pour le debugging

#### 2.2 Déployer l'Edge Function

```bash
# Se connecter à Supabase (si pas encore fait)
npx supabase login

# Lier le projet (remplacer PROJECT_REF par votre référence Supabase)
npx supabase link --project-ref VOTRE_PROJECT_REF

# Déployer la fonction
npx supabase functions deploy send-event-notifications
```

**Trouver votre PROJECT_REF** : Dans l'URL de votre projet Supabase
`https://sxdgvuqawjehfjexziwu.supabase.co` → `sxdgvuqawjehfjexziwu`

#### 2.3 Tester l'Edge Function Manuellement

```bash
# Remplacer VOTRE_PROJECT_REF et VOTRE_SERVICE_ROLE_KEY
curl -X POST https://sxdgvuqawjehfjexziwu.supabase.co/functions/v1/send-event-notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZGd2dXFhd2plaGZqZXh6aXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgzMjAxOCwiZXhwIjoyMDc5NDA4MDE4fQ.iuyWOsphGWJYAEY6AeeSSgdEelRgZJStG5b6HCXGYB0" \
  -H "Content-Type: application/json"
```

**Trouver SERVICE_ROLE_KEY** : Dashboard Supabase → Settings → API → `service_role` key

Résultat attendu :
```json
{"message":"No events to notify"}
```
Ou si un événement est dans 15 minutes :
```json
{"success":true,"eventsNotified":["Nom de l'événement"],"messagesSent":10,"invalidTokens":0}
```

#### 2.4 Configurer le CRON

**Important** : Ouvrez [003_setup_cron_notifications.sql](supabase/migrations/003_setup_cron_notifications.sql) et remplacez `VOTRE_PROJECT_REF` par votre vraie référence de projet.

Puis exécutez dans **SQL Editor** :
```sql
-- Copier-coller le contenu du fichier 003 (après modification) et exécuter
```

**Vérifier que le CRON fonctionne** :
```sql
SELECT * FROM cron.job WHERE jobname = 'send-event-notifications-every-minute';
```

Vous devriez voir une ligne avec `schedule = '* * * * *'`.

---

### Étape 3 : Tester sur Appareil Physique

**⚠️ IMPORTANT** : Les notifications push ne fonctionnent PAS sur simulateurs/émulateurs. Vous devez tester sur un **appareil physique**.

#### Sur iPhone (iOS)

```bash
# Build de développement
eas build --profile development --platform ios

# Une fois le build terminé, télécharger et installer l'app sur votre iPhone
```

#### Sur Android

```bash
# Build de développement
eas build --profile development --platform android

# Une fois le build terminé, télécharger et installer l'APK sur votre Android
```

**Tests à effectuer** :
1. ✅ **Login** → Aller dans Supabase Dashboard → Table `guests` → Vérifier qu'un `push_token` apparaît pour votre utilisateur
2. ✅ **Logout** → Vérifier que le `push_token` devient `null`
3. ✅ **Notification test** :
   - Créer un événement de test dans la table `PlanningEvent` qui commence dans 16 minutes
   - Attendre 1 minute (le CRON va s'exécuter)
   - Vous devriez recevoir une notification 15 minutes avant l'événement

---

## 🔍 Debugging

### Vérifier les Logs de l'Edge Function

Dans **Supabase Dashboard** → **Edge Functions** → `send-event-notifications` → **Logs**

Vous devriez voir :
```
[Notif] Function triggered: 2026-02-22T14:30:00.000Z
[Notif] No events to notify
```

Ou si un événement est proche :
```
[Notif] Notifying for: Cérémonie
[Notif] Total tokens: 10
```

### Vérifier la Table notifications_log

```sql
SELECT * FROM notifications_log ORDER BY sent_at DESC LIMIT 10;
```

Vous devriez voir les notifications envoyées avec leur statut.

### Problèmes Courants

| Problème | Cause | Solution |
|----------|-------|----------|
| Token est `null` dans `guests` | Simulateur ou permissions refusées | Tester sur appareil physique, vérifier permissions iOS/Android |
| Notifications pas reçues | CRON pas configuré | Vérifier `SELECT * FROM cron.job` |
| Edge Function erreur 500 | PROJECT_REF incorrect | Vérifier l'URL dans le SQL CRON |
| Token `DeviceNotRegistered` | App désinstallée/réinstallée | Normal - le token sera automatiquement nettoyé |

---

## 🎯 Points de Contrôle Finaux

Avant le jour J, vérifiez :
- [ ] Le compte EAS est créé et le Project ID est dans `.env`
- [ ] La colonne `push_token` existe dans la table `guests`
- [ ] L'Edge Function est déployée et testée manuellement
- [ ] Le CRON est configuré et fonctionne (vérifier dans `cron.job`)
- [ ] Les tests ont été faits sur **iPhone physique** ✅
- [ ] Les tests ont été faits sur **Android physique** (important !)
- [ ] Un événement de test a été créé et la notification a été reçue

---

## 🛑 Rollback (En Cas de Problème)

Si les notifications push causent des problèmes, désactivez le CRON :

```sql
SELECT cron.unschedule('send-event-notifications-every-minute');
```

Les **notifications locales** continueront de fonctionner en fallback.

---

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. Les logs Supabase Edge Functions
2. Les logs de l'app en mode dev (`__DEV__` console logs)
3. La table `notifications_log` pour les erreurs

**Documentation utile** :
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
