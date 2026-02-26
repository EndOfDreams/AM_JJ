# App Store Submission - Guide Complet

## 1. Informations App Store Connect

### Nom de l'App
```
WedSnap - Photos de Mariage
```

### Sous-titre (30 caractères max)
```
Partagez vos photos en direct
```

### Categorie
- **Principale** : Photo & Video
- **Secondaire** : Lifestyle

### URL de Confidentialite
```
https://endofdreams.github.io/AM_JJ/privacy-policy.html
```

### URL de Support
```
mailto:contact@wedsnap.app
```

---

## 2. Description App Store (4000 caracteres max)

### Version Francaise (App Store FR)

```
Capturez et partagez les plus beaux moments de votre mariage en temps reel avec tous vos invites.

WedSnap est une application elegante de partage de photos et videos concue pour les mariages et evenements prives. Offrez a vos invites un espace securise pour immortaliser chaque instant de votre celebration.

FONCTIONNALITES PRINCIPALES :

- Capture photo et video en temps reel avec interface premium
- Fil d'actualite en direct : voyez les photos de tous les invites instantanement
- Systeme de likes et interactions entre invites
- Planning de l'evenement avec notifications de rappel
- Partage et telechargement des photos
- Interface elegante avec animations fluides

EXPERIENCE PHOTO PREMIUM :
- Zoom par pincement
- Mise au point tactile
- Flash intelligent
- Enregistrement video jusqu'a 30 secondes
- Effet de confirmation apres chaque capture

PLANNING INTEGRE :
- Timeline visuelle de votre evenement
- Statut en temps reel des activites
- Notifications 15 minutes avant chaque moment cle

SECURITE ET CONFIDENTIALITE :
- Acces reserve aux invites uniquement
- Aucun suivi publicitaire
- Donnees hebergees de maniere securisee
- Politique de confidentialite transparente

Telechargez l'application et creez des souvenirs inoubliables ensemble.
```

### Version Anglaise (App Store EN)

```
Capture and share the most beautiful moments of your wedding in real time with all your guests.

WedSnap is an elegant photo and video sharing app designed for weddings and private events. Give your guests a secure space to capture every moment of your celebration.

KEY FEATURES:

- Real-time photo and video capture with premium interface
- Live feed: see all guest photos instantly
- Like system and guest interactions
- Event planning with reminder notifications
- Photo sharing and downloading
- Elegant interface with smooth animations

PREMIUM PHOTO EXPERIENCE:
- Pinch-to-zoom
- Tap-to-focus
- Smart flash
- Video recording up to 30 seconds
- Confirmation effect after each capture

INTEGRATED PLANNING:
- Visual event timeline
- Real-time activity status
- Notifications 15 minutes before each key moment

SECURITY AND PRIVACY:
- Guest-only access
- No ad tracking
- Securely hosted data
- Transparent privacy policy

Download the app and create unforgettable memories together.
```

---

## 3. Mots-cles (100 caracteres max, separes par virgule)

### Francais
```
mariage,photos,evenement,partage,invites,celebration,souvenir,album,direct,famille
```

### Anglais
```
wedding,photos,event,sharing,guests,celebration,memories,album,live,family
```

---

## 4. Promotional Text (170 caracteres max)

### Francais
```
Partagez les plus beaux moments de votre mariage en temps reel. Photos, videos et planning pour tous vos invites.
```

### Anglais
```
Share the most beautiful moments of your wedding in real time. Photos, videos and planning for all your guests.
```

---

## 5. Quoi de Neuf (What's New)

```
Version 1.0 - Lancement initial
- Capture photo et video en temps reel
- Fil d'actualite en direct avec mises a jour instantanees
- Systeme de likes
- Planning d'evenement avec notifications
- Partage et telechargement de photos
```

---

## 6. Age Rating (Content Descriptions)

Repondre "None" a TOUTES les questions :
- Cartoon or Fantasy Violence: **None**
- Realistic Violence: **None**
- Prolonged Graphic or Sadistic Realistic Violence: **None**
- Profanity or Crude Humor: **None**
- Mature/Suggestive Themes: **None**
- Horror/Fear Themes: **None**
- Medical/Treatment Information: **None**
- Alcohol, Tobacco, or Drug Use or References: **None**
- Simulated Gambling: **None**
- Sexual Content or Nudity: **None**
- Unrestricted Web Access: **None**
- Gambling with Real Currency: **None**

**Age Rating resultant : 4+**

---

## 7. App Review Information (Reviewer Notes)

### Review Notes (texte a copier dans App Store Connect)

```
Thank you for reviewing our app.

WedSnap is a private photo and video sharing application designed for wedding events.
It provides guests with a secure way to capture and share moments during the celebration.

HOW TO TEST:
- The app requires guest credentials to log in
- Demo account for review:
  Nom: Test Reviewer
  Mot de passe: reviewer2024

KEY FEATURES TO TEST:
1. Login screen: Enter the demo credentials above
2. Camera tab (center): Take a photo or record a video (up to 30s)
3. Feed tab (swipe left): View all shared photos in real-time
4. Planning tab (swipe right): See the event timeline
5. Settings: Access account deletion and content reporting

IMPORTANT NOTES:
- This app is designed for private events (weddings)
- All content is user-generated (photos/videos from guests)
- Content moderation system is implemented (report button on each photo)
- Full account deletion is available in Settings
- No ads, no tracking, no third-party analytics
- Camera and microphone permissions are required for core functionality
```

### Contact Information
- **First Name** : Camille
- **Last Name** : PERES
- **Phone** : [votre numero de telephone]
- **Email** : camille.peres25@gmail.com

### Demo Account
- **Nom** : Test Reviewer
- **Mot de passe** : reviewer2024

**IMPORTANT** : Vous devez creer ce compte de test dans Supabase Auth AVANT de soumettre !

```sql
-- Creer le compte de test dans Supabase SQL Editor :
-- 1. D'abord, creez l'utilisateur via Supabase Auth Dashboard :
--    Email: test.reviewer@wedding.local
--    Password: reviewer2024
--
-- 2. Puis ajoutez-le a la table guests :
INSERT INTO guests (user_id, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test.reviewer@wedding.local'),
  'Test Reviewer'
);
```

---

## 8. Screenshots Guidelines

### iPhone 6.7" (iPhone 15 Pro Max) - OBLIGATOIRE
- **Taille** : 1290 x 2796 pixels
- **Nombre** : 5-10 screenshots

### Screenshots recommandes (dans cet ordre) :

1. **Welcome Screen** - L'ecran de connexion avec le logo et le design premium
   - Montre la qualite de l'interface
   - Texte overlay : "Partagez vos moments"

2. **Camera Screen** - Interface de capture photo
   - Montre la camera avec les controles
   - Texte overlay : "Capturez en temps reel"

3. **Feed Screen** - Fil de photos avec plusieurs images
   - Montre le feed en grille avec des photos
   - Texte overlay : "Decouvrez les photos de tous les invites"

4. **Photo Detail** - Vue detail d'une photo avec likes
   - Montre le systeme de likes
   - Texte overlay : "Likez vos photos preferees"

5. **Planning Screen** - Timeline de l'evenement
   - Montre le planning avec les heures
   - Texte overlay : "Suivez le programme en direct"

6. **Settings** - Page parametres (optionnel)
   - Montre les options disponibles
   - Texte overlay : "Gerez votre compte"

### Comment prendre les screenshots :
```bash
# Sur simulateur iOS :
# Cmd + S pour sauvegarder un screenshot

# Sur device physique :
# Bouton lateral + Volume haut simultanement

# Taille correcte : utilisez un iPhone 15 Pro Max ou simulateur equivalent
```

### Conseils pour les screenshots :
- Utilisez des photos de mariage de qualite (pas de visages reels si possible)
- Montrez l'interface en utilisation reelle
- Ajoutez des textes overlay si souhaite (via Figma, Canva, ou autre)
- Pas de bezels/mockups necessaires (Apple les gere)

---

## 9. App Privacy (Data Collection)

Dans App Store Connect > App Privacy :

### Data Types Collected :

**1. Contact Info - Name**
- Used for: App Functionality
- Linked to User: Yes
- Tracking: No

**2. Contact Info - Email Address**
- Used for: App Functionality
- Linked to User: Yes
- Tracking: No

**3. Photos or Videos**
- Used for: App Functionality
- Linked to User: No
- Tracking: No

### Data NOT Collected :
- Location
- Health & Fitness
- Financial Info
- Sensitive Info
- Identifiers (no IDFA)
- Usage Data
- Diagnostics
- Browsing History
- Search History
- Purchases

---

## 10. Checklist Pre-Soumission

### Avant de soumettre, verifiez :

- [ ] Compte Apple Developer cree et paye (99$/an)
- [ ] Build production cree via EAS : `eas build --profile production --platform ios`
- [ ] Build uploade sur App Store Connect
- [ ] Screenshots prets (au moins 5 pour iPhone 6.7")
- [ ] Description remplie (FR + EN)
- [ ] Mots-cles remplis
- [ ] Age rating rempli (4+)
- [ ] Privacy Policy URL active et accessible
- [ ] Compte de test cree dans Supabase (Test Reviewer / reviewer2024)
- [ ] Review Notes copiees dans App Store Connect
- [ ] App Privacy rempli dans App Store Connect
- [ ] Contact info remplie (email, telephone)
- [ ] Categorie selectionnee (Photo & Video)
- [ ] Prix : Gratuit

---

## 11. Erreurs Courantes a Eviter

1. **Pas de compte de test** : Apple REJECTERA si pas de credentials de demo
2. **Privacy Policy down** : Verifiez que l'URL fonctionne AVANT soumission
3. **Screenshots mauvaise taille** : Utilisez exactement 1290x2796 pour iPhone 6.7"
4. **Crash au lancement** : Testez le build production AVANT soumission
5. **Permissions sans justification** : Chaque permission doit avoir une explication claire
6. **Pas de bouton "Supprimer compte"** : Deja implemente (Settings)
