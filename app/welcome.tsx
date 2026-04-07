// app/welcome.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import { registerForPushNotifications } from '@/lib/notifications';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { Asset } from "expo-asset";
import { CheckCircle2, Hash, Heart, Lock, Sparkles, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { signIn } from "../lib/supabase";
import { scale, verticalScale, moderateScale, SCREEN_WIDTH } from "../lib/responsive";

const { width, height } = Dimensions.get("window");

// Floating particle with advanced animation
const FloatingParticle: React.FC<{ delay: number; index: number }> = ({ delay, index }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -40,
            duration: 6000 + index * 1000,
            delay,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 6000 + index * 1000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 15,
            duration: 4000 + index * 800,
            delay,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -15,
            duration: 4000 + index * 800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 4000 + index * 800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 3000 + index * 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.15,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 15000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 2500 + index * 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 2500 + index * 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.floatingParticle,
        {
          left: `${8 + index * 16}%`,
          top: `${12 + (index % 4) * 22}%`,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      {index % 2 === 0 ? (
        <Heart size={16} color="#ffbed0" fill="#ffbed0" />
      ) : (
        <Sparkles size={14} color="#abc4e7" />
      )}
    </Animated.View>
  );
};

// Advanced blob with morphing animation
const AnimatedBlob: React.FC<{ index: number }> = ({ index }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 50,
            duration: 28000 + index * 10000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -50,
            duration: 28000 + index * 10000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 28000 + index * 10000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: 60,
            duration: 30000 + index * 12000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -60,
            duration: 30000 + index * 12000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 30000 + index * 12000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 15000 + index * 5000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 15000 + index * 5000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 15000 + index * 5000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 120000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        index === 0 ? styles.blob1 : styles.blob1,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    />
  );
};

export default function Welcome() {
  const router = useRouter();
  const [eventCode, setEventCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const VALID_EVENT_CODES = ['AMJJ2024', 'DEMO2024'];
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<'none' | 'video'>('none');
  const whiteOverlayAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<any>(null);

  // Advanced animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  const cardScale = useRef(new Animated.Value(1)).current;

  // Border gradient animation
  const borderGradient = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sophisticated entrance
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Logo breathing with subtle rotation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.03,
            duration: 3500,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 0.92,
            duration: 3500,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 7000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: 0,
            duration: 7000,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Premium glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.5,
          duration: 2500,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: false,
        }),
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2500,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Elegant shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: width * 1.5,
          duration: 2500,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(shimmerX, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotating border gradient
    Animated.loop(
      Animated.timing(borderGradient, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  // Preload transition video on mount for instant playback
  useEffect(() => {
    Asset.fromModule(require('../assets/Connexion_paradis.mp4')).downloadAsync().catch(() => {});
  }, []);

  // Déclenche la lecture dès que la phase passe à 'video'
  useEffect(() => {
    if (transitionPhase === 'video' && videoRef.current) {
      videoRef.current.playAsync().catch(() => {});
    }
  }, [transitionPhase]);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  const handleFocus = (field: string) => {
    setFocusedField(field);
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const fadeToWhiteAndNavigate = () => {
    Animated.timing(whiteOverlayAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => router.replace('/'));
  };

  const handleVideoEnd = () => {
    fadeToWhiteAndNavigate();
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!eventCode.trim() || !name.trim() || !password.trim()) {
      setErrorMessage("Veuillez remplir tous les champs");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1.02, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (!VALID_EVENT_CODES.includes(eventCode.trim().toUpperCase())) {
      setErrorMessage("Code événement invalide");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1.02, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const user = await signIn(name, password);
      await AsyncStorage.setItem("wedding_logged_in", "true");
      await AsyncStorage.setItem("wedding_user_info", JSON.stringify(user));
      registerForPushNotifications(user.user_id).catch(err => {
        if (__DEV__) console.warn('[Welcome] Failed to register push token:', err);
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auth réussie → vidéo fullscreen immédiatement + fade en parallèle
      setTransitionPhase('video');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(err.message || "Erreur de connexion");
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1.03, duration: 60, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['transparent', '#abc4e7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Image Blob */}
      <Image
        source={require('../assets/degrade_rose.png')}
        style={styles.blobTop}
        resizeMode="cover"
      />

      {/* Animated blobs */}
      <Image
        source={require('../assets/Dedrade_bleu.png')}
        style={styles.blob1}
        resizeMode="cover"
      />

      {/* Floating particles */}
      <View style={styles.particlesContainer}>
        {[...Array(6)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 500} index={i} />
        ))}
      </View>

      {/* Video toujours monté (1×1px invisible) pour buffering — plein écran quand actif */}
      <View
        pointerEvents="none"
        style={transitionPhase === 'video' ? styles.transitionVideo : styles.videoPreload}
      >
        <Video
          ref={videoRef}
          source={require('../assets/Connexion_paradis.mp4')}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
          isMuted={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) handleVideoEnd();
          }}
        />
      </View>

      {/* Animated white bloom overlay — fades in over 600ms après la fin de la vidéo */}
      {transitionPhase === 'video' && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: '#ffffff', opacity: whiteOverlayAnim, zIndex: 300 },
          ]}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ scale: cardScale }] }
            ]}
          >
            {/* Logo section with parallax */}
            <Animated.View
              style={[
                styles.logoSection,
                {
                  transform: [
                    { translateY: slideAnim },
                    { scale: logoScale },
                    { rotate: logoRotateInterpolate },
                  ],
                },
              ]}
            >
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../assets/AM_JJ.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            {/* Premium Glass Card */}
            <Animated.View
              style={[
                styles.cardWrapper,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Main card */}
              <View style={styles.card}>
                <BlurView intensity={0} tint="light" style={styles.cardBlur}>

                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.appName}>WEDSNAP</Text>
                    <Text style={styles.cardTitle}>Notre Mariage</Text>

                    <View style={styles.headerDivider}>
                      <LinearGradient
                        colors={['rgba(255, 221, 253, 0)', '#ffbed0', 'rgba(255, 221, 253, 0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerLineGradient}
                      />
                      <View style={styles.headerHeartWrapper}>
                        <Heart size={11} color="#ffbed0" fill="#ffbed0" />
                      </View>
                      <LinearGradient
                        colors={['rgba(255, 221, 253, 0)', '#ffbed0', 'rgba(255, 221, 253, 0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerLineGradient}
                      />
                    </View>

                    <Text style={styles.cardSubtitle}>Accès réservé aux invités</Text>
                  </View>

                  {/* Form */}
                  <View style={styles.formContainer}>
                    {/* Event Code Input */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>CODE ÉVÉNEMENT</Text>
                      <View style={styles.inputWrapper}>
                        {focusedField === 'eventCode' && (
                          <Animated.View style={styles.inputGlowPink} />
                        )}
                        <View style={[
                          styles.inputContainer,
                          focusedField === 'eventCode' && styles.inputFocused
                        ]}>
                          <LinearGradient
                            colors={
                              focusedField === 'eventCode'
                                ? ['#ffbed0', '#FFFFFF']
                                : ['#FFFFFF', '#FFFFFF']
                            }
                            style={styles.inputGradientBg}
                          />
                          <View style={styles.inputIconWrapper}>
                            <Hash
                              size={17}
                              color={focusedField === 'eventCode' ? '#ffbed0' : '#9CA3AF'}
                              strokeWidth={2}
                            />
                          </View>
                          <TextInput
                            placeholder="Code de votre événement"
                            placeholderTextColor="#9CA3AF"
                            style={styles.input}
                            value={eventCode}
                            onChangeText={(t) => { setEventCode(t); setErrorMessage(""); }}
                            onFocus={() => handleFocus('eventCode')}
                            onBlur={() => setFocusedField(null)}
                            autoCapitalize="characters"
                            autoCorrect={false}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>NOM COMPLET</Text>
                      <View style={styles.inputWrapper}>
                        {focusedField === 'name' && (
                          <Animated.View style={styles.inputGlowPink} />
                        )}
                        <View style={[
                          styles.inputContainer,
                          focusedField === 'name' && styles.inputFocused
                        ]}>
                          <LinearGradient
                            colors={
                              focusedField === 'name'
                                ? ['#ffbed0', '#FFFFFF']
                                : ['#FFFFFF', '#FFFFFF']
                            }
                            style={styles.inputGradientBg}
                          />
                          <View style={styles.inputIconWrapper}>
                            <User
                              size={17}
                              color={focusedField === 'name' ? '#ffbed0' : '#9CA3AF'}
                              strokeWidth={2}
                            />
                          </View>
                          <TextInput
                            placeholder="Prénom & Nom"
                            placeholderTextColor="#9CA3AF"
                            style={styles.input}
                            value={name}
                            onChangeText={(t) => { setName(t); setErrorMessage(""); }}
                            onFocus={() => handleFocus('name')}
                            onBlur={() => setFocusedField(null)}
                            autoCapitalize="words"
                          />
                        </View>
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{"CODE D'ACCÈS"}</Text>
                      <View style={styles.inputWrapper}>
                        {focusedField === 'password' && (
                          <Animated.View style={styles.inputGlowPurple} />
                        )}
                        <View style={[
                          styles.inputContainer,
                          focusedField === 'password' && styles.inputFocusedPurple
                        ]}>
                          <LinearGradient
                            colors={
                              focusedField === 'password'
                                ? ['#abc4e7', '#FFFFFF']
                                : ['#FFFFFF', '#FFFFFF']
                            }
                            style={styles.inputGradientBg}
                          />
                          <View style={styles.inputIconWrapper}>
                            <Lock
                              size={17}
                              color={focusedField === 'password' ? '#abc4e7' : '#9CA3AF'}
                              strokeWidth={2}
                            />
                          </View>
                          <TextInput
                            placeholder="Entrez votre code"
                            placeholderTextColor="#9CA3AF"
                            style={styles.input}
                            secureTextEntry
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrorMessage(""); }}
                            onFocus={() => handleFocus('password')}
                            onBlur={() => setFocusedField(null)}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Error Message */}
                    {errorMessage ? (
                      <Animated.View style={styles.errorContainer}>
                        <LinearGradient
                          colors={['#ffbed0', '#ffbed0']}
                          style={styles.errorGradient}
                        >
                          <Text style={styles.errorText}>{errorMessage}</Text>
                        </LinearGradient>
                      </Animated.View>
                    ) : null}

                    {/* Submit Button */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleSubmit}
                      disabled={transitionPhase !== 'none'}
                      style={styles.buttonWrapper}
                      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                      <LinearGradient
                        colors={['#ff99cc', '#77bbff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                      >
                        {/* Multi-layer shimmer */}
                        <Animated.View
                          style={[
                            styles.shimmer,
                            { transform: [{ translateX: shimmerX }, { skewX: '-20deg' }] },
                          ]}
                        >
                          <LinearGradient
                            colors={[
                              'rgba(255,255,255,0)',
                              'rgba(255,255,255,0.5)',
                              'rgba(255,255,255,0.8)',
                              'rgba(255,255,255,0.5)',
                              'rgba(255,255,255,0)',
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                          />
                        </Animated.View>

                        <View style={styles.buttonContent}>
                          <Text style={styles.buttonText}>ACCÉDER</Text>
                          <Heart size={15} color="white" fill="white" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Premium bottom decoration */}
                  <View style={styles.bottomDecoration}>
                    {[...Array(7)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.decorationDot,
                          i === 3 && styles.decorationDotActive,
                          (i === 2 || i === 4) && styles.decorationDotSecondary,
                        ]}
                      />
                    ))}
                  </View>
                </BlurView>

              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -height * 0.15,
    left: -width * 0.2,
    width: width * 1.4,
    height: height * 0.85,
    borderRadius: width * 0.7,
    opacity: 1,
  },
  blob1: {
    position: 'absolute',
    bottom: -height * 0.15,
    left: -width * 0.2,
    width: width * 1.4,
    height: height * 0.85,
    borderRadius: width * 0.7,
    opacity: 1,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 1,
  },
  floatingParticle: {
    position: 'absolute',
  },
  keyboardView: {
    flex: 1,
    zIndex: 5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  contentContainer: {
    width: '100%',
    maxWidth: scale(420),
    alignSelf: 'center',
    paddingHorizontal: scale(20),
  },

  // Transition video (fullscreen, no borders)
  transitionVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: 'black',
  },
  // Container 1×1px pour buffering sans bloquer l'UI
  videoPreload: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: verticalScale(36),
    zIndex: 10,
  },
  logoWrapper: {
    position: 'relative',
    width: scale(220),
    height: scale(155),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlowLayer1: {
    position: 'absolute',
    width: scale(280),
    height: scale(215),
    borderRadius: scale(110),
    backgroundColor: '#ffbed0',
    shadowColor: '#ffbed0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
  },
  logoGlowLayer2: {
    position: 'absolute',
    width: scale(250),
    height: scale(185),
    borderRadius: scale(95),
    backgroundColor: '#abc4e7',
    shadowColor: '#abc4e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 35,
  },
  logoGlowLayer3: {
    position: 'absolute',
    width: scale(230),
    height: scale(165),
    borderRadius: scale(83),
    backgroundColor: '#abc4e7',
    shadowColor: '#abc4e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  // Card
  cardWrapper: {
    position: 'relative',
  },
  cardGlowOuter: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 50,
    backgroundColor: 'transparent',
    shadowColor: '#ffbed0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  cardGlowMid: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
    backgroundColor: 'transparent',
    shadowColor: '#abc4e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
  },
  card: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  cardBlur: {
    width: '100%',
  },
  topAccent: {
    height: 3,
    opacity: 0.92,
  },

  // Card header
  cardHeader: {
    paddingTop: verticalScale(34),
    paddingHorizontal: scale(30),
    alignItems: 'center',
  },
  appName: {
    fontSize: moderateScale(24),
    fontWeight: '400',
    letterSpacing: 3,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 185, 208, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardTitle: {
    fontSize: moderateScale(28),
    fontWeight: '300',
    letterSpacing: 5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    width: 140,
  },
  headerLineGradient: {
    flex: 1,
    height: 1.5,
  },
  headerHeartWrapper: {
    backgroundColor: 'rgba(255, 221, 253, 0.1)',
    borderRadius: 10,
    padding: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: 0.8,
  },

  // Form
  formContainer: {
    padding: scale(30),
    paddingTop: scale(26),
    gap: 22,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingLeft: 2,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputGlowPink: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 15,
    backgroundColor: '#ffbed0',
    opacity: 0.38,
    shadowColor: '#ffbed0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
  },
  inputGlowPurple: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 15,
    backgroundColor: '#abc4e7',
    opacity: 0.38,
    shadowColor: '#abc4e7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.9)',
    borderRadius: 15,
    height: verticalScale(54),
    paddingHorizontal: scale(16),
    position: 'relative',
    overflow: 'hidden',
  },
  inputGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  inputFocused: {
    borderColor: '#ffbed0',
    borderWidth: 2,
  },
  inputFocusedPurple: {
    borderColor: '#abc4e7',
    borderWidth: 2,
  },
  inputIconWrapper: {
    marginRight: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '400',
    height: '100%',
    zIndex: 1,
  },

  // Error
  errorContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ffbed0',
  },
  errorGradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Button
  buttonWrapper: {
    marginTop: 10,
  },
  button: {
    height: verticalScale(54),
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 35,
    elevation: 12,
  },
  shimmer: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 200,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Bottom decoration
  bottomDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 22,
  },
  decorationDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  decorationDotSecondary: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(147, 197, 253, 0.4)',
  },
  decorationDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffbed0',
    shadowColor: '#ffbed0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});