# Migration vers app.config.js

## ⚠️ IMPORTANT: Configuration des Variables d'Environnement

Pour utiliser les variables d'environnement (clés Supabase), vous devez utiliser `app.config.js` au lieu de `app.json`.

## 📋 Étapes de Migration

### 1. Renommer app.json (OPTIONNEL)
```bash
# Sauvegarder l'ancien fichier
mv app.json app.json.backup
```

**Note:** Expo utilisera automatiquement `app.config.js` s'il existe, même si `app.json` est présent.

### 2. Vérifier app.config.js
Le fichier [`app.config.js`](file:///c:/Users/Camille%20PERES/AM_jj/app.config.js) a déjà été créé avec:
- Toutes les configurations de `app.json`
- Support des variables d'environnement via `process.env`

### 3. Redémarrer Expo
```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis relancer
npx expo start --clear
```

## ✅ Vérification

Après redémarrage, vérifiez qu'il n'y a plus d'erreurs dans le terminal.

Les variables d'environnement seront chargées depuis `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🔒 Sécurité

**IMPORTANT:** Assurez-vous que `.env` est dans `.gitignore` pour ne pas exposer vos clés !

Vérifiez dans `.gitignore`:
```
.env
.env.local
```
