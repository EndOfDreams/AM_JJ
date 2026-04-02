// app/_layout.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from "expo-router";
import React, { Component, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureNotificationHandler, setupNotificationChannels } from '@/lib/notifications';

// STORE_COMPLIANCE: Error Boundary to catch rendering errors and prevent crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Error info:', errorInfo);
    }
    // TODO: Send to crash reporting service in production (e.g., Sentry)
  }

  handleRetry = async () => {
    // Clear any corrupted state
    try {
      await AsyncStorage.removeItem('wedding_logged_in');
      await AsyncStorage.removeItem('wedding_user_info');
    } catch (e) {
      // Ignore cleanup errors
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <View style={errorStyles.content}>
            <Text style={errorStyles.emoji}>😔</Text>
            <Text style={errorStyles.title}>Oups, une erreur est survenue</Text>
            <Text style={errorStyles.message}>
              {"L'application a rencontré un problème inattendu."}
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={errorStyles.errorDetail}>
                {this.state.error.message}
              </Text>
            )}
            <TouchableOpacity style={errorStyles.button} onPress={this.handleRetry}>
              <Text style={errorStyles.buttonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorDetail: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function RootLayout() {
  const [isLogged, setIsLogged] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const notifResponseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  // 0. Setup notifications (once)
  useEffect(() => {
    configureNotificationHandler();
    setupNotificationChannels();

    // Listener: user taps a notification → navigate to planning
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (__DEV__) console.log('[Notif] Tapped:', data);
        if (data?.screen === 'planning') {
          router.push({ pathname: '/', params: { screen: 'planning' } });
        }
      }
    );

    // NEW: Refresh push token when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        try {
          const userInfo = await AsyncStorage.getItem('wedding_user_info');
          if (userInfo) {
            const user = JSON.parse(userInfo);
            if (user.user_id) {
              const { registerForPushNotifications } = await import('@/lib/notifications');
              registerForPushNotifications(user.user_id).catch(err => {
                if (__DEV__) console.warn('[Layout] Token refresh failed:', err);
              });
            }
          }
        } catch (err) {
          if (__DEV__) console.warn('[Layout] Error refreshing token:', err);
        }
      }
    });

    // Check if app was opened from a killed state via notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification.request.content.data;
        if (__DEV__) console.log('[Notif] App launched from notification:', data);
      }
    });

    return () => {
      notifResponseListener.current?.remove();
      appStateSubscription?.remove();
    };
  }, []);

  // 1. Check AsyncStorage au montage
  useEffect(() => {
    (async () => {
      try {
        if (__DEV__) console.log("[layout] checking AsyncStorage...");
        const logged = await AsyncStorage.getItem("wedding_logged_in");
        if (__DEV__) console.log("[layout] AsyncStorage value:", logged);
        setIsLogged(logged === "true");
      } catch (err) {
        if (__DEV__) console.error("[layout] AsyncStorage error:", err);
        setIsLogged(false);
      }
    })();
  }, []);

  // 2. Navigation logic - s'exécute UNE SEULE FOIS après le chargement
  useEffect(() => {
    if (isLogged === null || isNavigating) return;

    const inWelcome = segments[0] === "welcome";

    if (__DEV__) console.log("[layout] Navigation check:", { isLogged, inWelcome, segments });

    // Si pas connecté et pas sur welcome -> vérifier AsyncStorage d'abord (welcome peut venir de se connecter)
    if (!isLogged && !inWelcome) {
      AsyncStorage.getItem("wedding_logged_in").then(stored => {
        if (stored === "true") {
          // Welcome vient de se connecter — mettre à jour l'état, pas de redirection
          setIsLogged(true);
        } else {
          if (__DEV__) console.log("[layout] Not logged + not on welcome → redirecting to /welcome");
          setIsNavigating(true);
          setTimeout(() => {
            router.replace("/welcome");
            setIsNavigating(false);
          }, 50);
        }
      });
    }
    // Si connecté et sur welcome -> aller vers index
    else if (isLogged && inWelcome) {
      if (__DEV__) console.log("[layout] Logged + on welcome → redirecting to /");
      setIsNavigating(true);
      setTimeout(() => {
        router.replace("/");
        setIsNavigating(false);
      }, 50);
    }
    // Sinon tout va bien
    else {
      if (__DEV__) console.log("[layout] Navigation OK, staying on current screen");
    }
  }, [isLogged, segments]);

  // 3. Loading screen pendant la vérification
  if (isLogged === null || isNavigating) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8E8F0" }}>
        <ActivityIndicator size="large" color="#F472B6" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{
          headerShown: false,
          animation: "none",
        }}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="index" />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}