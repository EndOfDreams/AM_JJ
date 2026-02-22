# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AM_JJ is an Expo React Native wedding photo-sharing application with premium animations, real-time updates, and media capture capabilities. Built with TypeScript, Supabase, and React Native Reanimated.

## Development Commands

```bash
# Start development server
npx expo start
# or
npm start

# Run on specific platforms
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in web browser

# Code quality
npm run lint       # Run ESLint

# Reset project (moves starter code to app-example/)
npm run reset-project
```

**Running on device:** When `npx expo start` runs, scan the QR code with Expo Go app (iOS/Android) or press `a` for Android emulator, `i` for iOS simulator.

## Architecture Overview

### Navigation Pattern: Horizontal Scroll Tabs (Not Stack-Based)

The app uses a **ScrollView-based tab navigation** in [app/index.tsx](app/index.tsx) instead of `@react-navigation/tabs`:

```
ScrollView (horizontal, pagingEnabled)
├─ Screen 0: FeedScreen (x=0, swipe left to access)
├─ Screen 1: CameraScreen (x=width, default screen)
└─ Screen 2: PlanningScreen (x=width*2, swipe right to access)

BottomNav component
└─ Triggers scrollViewRef.current?.scrollTo() on press
```

**Why this approach:** Better performance for animated content, allows smooth parallax effects, independent screen lifecycles. The camera can pause when not focused.

### Authentication Flow

Location: [app/welcome.tsx](app/welcome.tsx) → [lib/supabase.ts](lib/supabase.ts)

1. User enters full name (e.g., "Anne-Marie Cabanac") + password
2. `nameToEmail()` converts to email format: `"anne-marie.cabanac@wedding.local"`
   - Normalizes accents (é→e, à→a)
   - Replaces spaces with dots
   - **Special hardcoded fix:** `"camille.peres@wedding.local"` → `"camille.peres.fix@wedding.local"` (account migration)
3. `supabase.auth.signInWithPassword()` uses bcrypt-hashed credentials
4. Stores authentication state in `AsyncStorage` with keys:
   - `"wedding_logged_in"`: boolean
   - `"wedding_user_info"`: JSON with user data

**Route guard:** [app/_layout.tsx](app/_layout.tsx) checks auth state on mount and redirects:
- Logged out + not on `/welcome` → redirect to `/welcome`
- Logged in + on `/welcome` → redirect to `/`

### Data Layer: Supabase Real-Time + Optimistic Updates

**Pattern used in [components/screens/FeedScreen.tsx](components/screens/FeedScreen.tsx):**

```
┌─ Initial Load: Query latest 50 photos + total count
│
├─ Real-Time Subscription:
│  └─ supabase.channel().on('postgres_changes')
│     └─ Listens to INSERT events on photos table
│     └─ Merges with optimistic items if ID matches
│
└─ Optimistic Updates:
   └─ DeviceEventEmitter.addListener('media.optimistic')
   └─ CameraScreen emits event immediately on capture
   └─ FeedScreen adds temp item with negative ID
   └─ When real INSERT arrives, replaces temp with server data
```

**Key Supabase tables:**
- `photos`: id, image_url, media_type ('photo'|'video'), likes, liked_by[], created_at, created_by
- `PlanningEvent`: id, time, title, description, started, order
- `guests`: user_id, full_name (for profile fetching)

**Media upload flow** ([lib/supabase.ts](lib/supabase.ts)):
1. Read file as base64 (expo-file-system)
2. Decode to ArrayBuffer (base64-arraybuffer package)
3. Upload to `supabase.storage.from('wedding-media')`
4. Get public URL via `getPublicUrl()`
5. Create photo entry in database

### Component Structure

```
components/
├── navigation/
│   └── BottomNav.tsx          # Bottom nav bar with scroll trigger
│
├── screens/
│   ├── FeedScreen.tsx         # Photo feed with real-time sync (1314 lines)
│   │   ├─ Animated.FlatList with staggered entrance
│   │   ├─ Like system (double-tap or button)
│   │   ├─ Share/download/bookmark features
│   │   ├─ Modal preview with swipe navigation
│   │   └─ Confetti explosion for new posts
│   │
│   ├── CameraScreen.tsx       # Camera capture with gestures (1102 lines)
│   │   ├─ Photo capture with flash effect
│   │   ├─ Video recording (max 30s) with progress ring
│   │   ├─ Pinch zoom (0-1 range, sensitivity 0.15)
│   │   ├─ Tap-to-focus with golden square animation
│   │   └─ Success animation with particle explosion
│   │
│   └── PlanningScreen.tsx     # Event timeline (382 lines)
│       ├─ Vertical timeline with gradient line
│       ├─ Time-based status (relative to 8:00 AM reference)
│       └─ Real-time updates via Supabase subscription
│
└── ui/
    ├── PremiumHeader.tsx      # Blur + gradient header with floating particles
    ├── AnimatedBackground.tsx # 35 floating gold/rose particles
    └── LoadingBar.tsx         # Custom loading indicator
```

### Animation Architecture

Uses **React Native Reanimated** (not Three.js, despite dependency):

**Gesture handling pattern:**
```typescript
const zoom = useSharedValue(0);
const pinch = Gesture.Pinch()
  .onUpdate(event => {
    zoom.value = Math.max(0, Math.min(
      startZoom.value + (event.scale - 1) * 0.15,
      1
    ));
  });
const animatedProps = useAnimatedProps(() => ({ zoom: zoom.value }));
```

**Key animation components:**
- `FloatingParticle`: Vertical float + wobble + rotation + opacity breathing
- `MassiveConfettiParticle`: 50-particle radial burst with velocity-based trajectories
- `DecorativeElement`: Breathing scale + opacity pulse for sparkles/hearts
- `FocusIndicator`: Spring animation for tap-to-focus golden square

**Performance settings** (FeedScreen FlatList):
```typescript
initialNumToRender={5}
windowSize={5}
maxToRenderPerBatch={5}
removeClippedSubviews={false}  // Prevents flickering with animations
```

## Configuration Files

### Environment Variables (.env)

Required for Supabase connection:
```
EXPO_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

Accessed via `Constants.expoConfig?.extra` in [lib/supabase.ts](lib/supabase.ts).

### app.config.js

Key configuration:
- **Orientation:** Portrait-only
- **Plugins:** expo-router, expo-camera, expo-media-library (with permissions)
- **Experiments:**
  - `typedRoutes: true` (type-safe navigation)
  - `reactCompiler: true` (Babel optimization)
- **Platform bundles:**
  - iOS: `com.camilleperes.amjj`
  - Android: `com.camilleperes.amjj`

### tsconfig.json

Path alias configured:
```json
"paths": {
  "@/*": ["./*"]
}
```

Use `import { ... } from '@/lib/supabase'` for cleaner imports.

## Key Patterns & Gotchas

### Camera State Management

[components/screens/CameraScreen.tsx](components/screens/CameraScreen.tsx) manages multiple states:
- `isCameraReady`: Waits for camera stream initialization
- `isFocused`: Tracks if user is on Camera tab (pauses when not visible)
- `isRecording`: Prevents multiple simultaneous recordings
- `recordingProgress`: 0-100% for progress ring

**Long press detection:** 300ms threshold distinguishes photo capture (quick press) from video recording (long press).

### Optimistic Updates Pattern

When user captures media:
1. [CameraScreen.tsx](components/screens/CameraScreen.tsx) emits `DeviceEventEmitter.emit('media.optimistic', { tempId, mediaType, uri })`
2. [FeedScreen.tsx](components/screens/FeedScreen.tsx) immediately adds temp item to list with negative ID
3. Upload happens in background via `uploadPhotoInBackground()`
4. When Supabase fires INSERT event, replace temp item with server data

**Matching logic:** If media_type and creation time are close, merge optimistic with real item.

### Time-Based Event Status

[PlanningScreen.tsx](components/screens/PlanningScreen.tsx) uses **8:00 AM as reference start time**:
```typescript
const referenceStart = new Date().setHours(8, 0, 0, 0);
const currentTime = Date.now();
const eventTime = referenceStart + (event.time * 60 * 1000);

if (currentTime > eventTime) {
  // Event started → green badge "En cours"
} else {
  // Event pending → purple badge
}
```

### Permission Handling

Camera and microphone are **required** for app operation. Media library is optional (graceful fallback to native sharing).

Request pattern:
```typescript
const { status } = await Camera.requestCameraPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('Permission required', 'Camera access needed');
  return;
}
```

## Common Tasks

### Adding a New Screen

1. Create component in `components/screens/NewScreen.tsx`
2. Add to ScrollView in [app/index.tsx](app/index.tsx):
   ```typescript
   <View style={{ width: SCREEN_WIDTH }}>
     <NewScreen />
   </View>
   ```
3. Update `BottomNav` items array with new icon and navigation
4. Adjust scroll position calculation in `onScroll` handler

### Adding a New Animation

Use Reanimated pattern:
```typescript
const opacity = useSharedValue(0);
const scale = useSharedValue(0);

useEffect(() => {
  opacity.value = withSpring(1);
  scale.value = withTiming(1, { duration: 300 });
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }]
}));

return <Animated.View style={animatedStyle}>...</Animated.View>;
```

### Modifying Supabase Queries

All database functions are in [lib/supabase.ts](lib/supabase.ts):
- `uploadMedia(uri, type)`: Upload to storage
- `createPhotoEntry(imageUrl, mediaType, createdBy)`: Insert photo record
- `togglePhotoLike(photoId, userEmail, currentLikedBy)`: Update likes
- `fetchPlanningEvents()`: Get timeline events
- `updateEventStatus(eventId, started)`: Mark event as started

### Testing on Device

**iOS:**
```bash
npm run ios
# or for specific simulator
npx expo run:ios --device "iPhone 15 Pro"
```

**Android:**
```bash
npm run android
# Ensure emulator is running or device is connected via ADB
```

**Expo Go (development only):**
```bash
npx expo start
# Scan QR code with Expo Go app
```

## Dependencies of Note

- `@supabase/supabase-js`: Backend API & real-time subscriptions
- `expo-camera`: Camera API with video recording
- `expo-file-system`: File operations for media handling
- `react-native-reanimated`: High-performance animations
- `react-native-gesture-handler`: Touch & gesture management
- `lucide-react-native`: Icon library
- `zod`: Schema validation (see [lib/validation.ts](lib/validation.ts))
- `base64-arraybuffer`: Convert base64 to ArrayBuffer for Supabase uploads

**Unused dependencies:**
- `three` / `three-gltf-loader`: Listed but not actively used (planned for 3D venue visualization)

## Troubleshooting

**"Camera not ready" error:** Ensure `isCameraReady` state is true before calling `takePictureAsync()`. Add `onCameraReady` callback to `<CameraView>`.

**Photos not appearing in feed:** Check Supabase real-time subscription is active. Verify `postgres_changes` event listener is registered in [FeedScreen.tsx:148](components/screens/FeedScreen.tsx).

**Authentication fails with correct password:** Check if user email needs the hardcoded fix (`camille.peres.fix@wedding.local`). Verify bcrypt hashes in Supabase auth table match expected format.

**Animations laggy:** Ensure `useNativeDriver: true` is set where possible. For FlatList, adjust `windowSize` and `maxToRenderPerBatch` values.

**Build errors on iOS:** Run `npx expo prebuild --clean` then `npm run ios` to regenerate native project files.

**Metro bundler cache issues:** Run `npx expo start --clear` to clear cache and restart.
