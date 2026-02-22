// app/welcome.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import { requestNotificationPermission } from '@/lib/notifications';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { CheckCircle2, Heart, Lock, Sparkles, User } from "lucide-react-native";
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
        <Heart size={16} color="#FDA4AF" fill="#FDA4AF" />
      ) : (
        <Sparkles size={14} color="#DDD6FE" />
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
        index === 0 ? styles.blob1 : styles.blob2,
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
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Advanced animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
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

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  const handleFocus = (field: string) => {
    setFocusedField(field);
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!name.trim() || !password.trim()) {
      setErrorMessage("Veuillez remplir tous les champs");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Shake animation on error
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1.02, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 50, useNativeDriver: true }),
      ]).start();

      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const user = await signIn(name, password);
      await AsyncStorage.setItem("wedding_logged_in", "true");
      await AsyncStorage.setItem("wedding_user_info", JSON.stringify(user));

      // Request notification permission (non-blocking)
      requestNotificationPermission();

      // Success animation
      setIsSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.9,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.replace("/");
        });
      }, 1800);

    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion");
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Error shake
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
        colors={['#FFF1F2', '#FCE7F3', '#F3E8FF', '#EDE9FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated blobs */}
      <AnimatedBlob index={0} />
      <AnimatedBlob index={1} />

      {/* Floating particles */}
      <View style={styles.particlesContainer}>
        {[...Array(6)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 500} index={i} />
        ))}
      </View>

      {/* Success overlay */}
      {isSuccess && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successOpacity,
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: successScale }],
              alignItems: 'center',
            }}
          >
            <Text style={styles.successEmoji}>💍</Text>
            <Text style={styles.successText}>Bienvenue !</Text>
            <Text style={styles.successSubtext}>Connexion réussie</Text>
          </Animated.View>
        </Animated.View>
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
                {/* Multi-layer premium glow */}
                <Animated.View
                  style={[
                    styles.logoGlowLayer1,
                    { opacity: Animated.multiply(glowPulse, 0.25) },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.logoGlowLayer2,
                    { opacity: Animated.multiply(glowPulse, 0.35) },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.logoGlowLayer3,
                    { opacity: Animated.multiply(glowPulse, 0.2) },
                  ]}
                />

                {/* Logo card with depth */}
                <View style={styles.logoCard}>
                  <View style={styles.logoInnerCard}>
                    <Image
                      source={require('../assets/AM_JJ.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Premium Glass Card */}
            <Animated.View
              style={[
                styles.cardWrapper,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Animated glow layers */}
              <Animated.View
                style={[
                  styles.cardGlowOuter,
                  { opacity: Animated.multiply(glowPulse, 0.22) }
                ]}
              />
              <Animated.View
                style={[
                  styles.cardGlowMid,
                  { opacity: Animated.multiply(glowPulse, 0.28) }
                ]}
              />
              <Animated.View
                style={[
                  styles.cardGlowInner,
                  { opacity: Animated.multiply(glowPulse, 0.35) }
                ]}
              />

              {/* Main card */}
              <View style={styles.card}>
                <BlurView intensity={95} tint="light" style={styles.cardBlur}>
                  {/* Animated top accent */}
                  <LinearGradient
                    colors={['#F9A8D4', '#F472B6', '#E879F9', '#C084FC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.topAccent}
                  />

                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Notre Mariage</Text>

                    <View style={styles.headerDivider}>
                      <LinearGradient
                        colors={['rgba(244, 114, 182, 0)', '#F472B6', 'rgba(244, 114, 182, 0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerLineGradient}
                      />
                      <View style={styles.headerHeartWrapper}>
                        <Heart size={11} color="#F472B6" fill="#F472B6" />
                      </View>
                      <LinearGradient
                        colors={['rgba(244, 114, 182, 0)', '#F472B6', 'rgba(244, 114, 182, 0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerLineGradient}
                      />
                    </View>

                    <Text style={styles.cardSubtitle}>Accès réservé aux invités</Text>
                  </View>

                  {/* Form */}
                  <View style={styles.formContainer}>
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
                                ? ['#FFF1F2', '#FFFFFF']
                                : ['#FFFFFF', '#FFFFFF']
                            }
                            style={styles.inputGradientBg}
                          />
                          <View style={styles.inputIconWrapper}>
                            <User
                              size={17}
                              color={focusedField === 'name' ? '#F472B6' : '#9CA3AF'}
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
                                ? ['#FAF5FF', '#FFFFFF']
                                : ['#FFFFFF', '#FFFFFF']
                            }
                            style={styles.inputGradientBg}
                          />
                          <View style={styles.inputIconWrapper}>
                            <Lock
                              size={17}
                              color={focusedField === 'password' ? '#C084FC' : '#9CA3AF'}
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
                          colors={['#FEE2E2', '#FECACA']}
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
                      disabled={isLoading || isSuccess}
                      style={styles.buttonWrapper}
                      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                      <LinearGradient
                        colors={['#F43F5E', '#EC4899', '#D946EF', '#C026D3']}
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
                          {isLoading ? (
                            <>
                              <Sparkles size={17} color="white" />
                              <Text style={styles.buttonText}>CONNEXION...</Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.buttonText}>ACCÉDER</Text>
                              <Heart size={15} color="white" fill="white" />
                            </>
                          )}
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
  blob1: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 550,
    height: 550,
    borderRadius: 275,
    backgroundColor: '#FBCFE8',
    opacity: 0.32,
  },
  blob2: {
    position: 'absolute',
    bottom: -180,
    left: -120,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: '#DDD6FE',
    opacity: 0.38,
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

  // Success overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successEmoji: {
    fontSize: scale(100),
    marginBottom: 20,
  },
  successText: {
    fontSize: moderateScale(28),
    fontWeight: '300',
    color: '#1F2937',
    letterSpacing: 2,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: 0.5,
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
    backgroundColor: '#FBCFE8',
    shadowColor: '#F9A8D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
  },
  logoGlowLayer2: {
    position: 'absolute',
    width: scale(250),
    height: scale(185),
    borderRadius: scale(95),
    backgroundColor: '#DDD6FE',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 35,
  },
  logoGlowLayer3: {
    position: 'absolute',
    width: scale(230),
    height: scale(165),
    borderRadius: scale(83),
    backgroundColor: '#F5D0FE',
    shadowColor: '#E879F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
  },
  logoCard: {
    width: scale(220),
    height: scale(155),
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 45,
    elevation: 18,
    padding: 3,
  },
  logoInnerCard: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    backgroundColor: '#F9A8D4',
    shadowColor: '#F9A8D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 35,
  },
  cardGlowMid: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 30,
    backgroundColor: '#E879F9',
    shadowColor: '#E879F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 25,
  },
  cardGlowInner: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: '#C084FC',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 22,
  },
  card: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.09,
    shadowRadius: 70,
    elevation: 18,
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
  cardTitle: {
    fontSize: moderateScale(28),
    fontWeight: '300',
    letterSpacing: 5,
    color: '#1F2937',
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
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
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
    backgroundColor: '#F9A8D4',
    opacity: 0.38,
    shadowColor: '#F9A8D4',
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
    backgroundColor: '#C084FC',
    opacity: 0.38,
    shadowColor: '#C084FC',
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
    borderColor: '#F472B6',
    borderWidth: 2,
  },
  inputFocusedPurple: {
    borderColor: '#C084FC',
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
    borderColor: '#FECACA',
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
    backgroundColor: 'rgba(192, 132, 252, 0.4)',
  },
  decorationDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EC4899',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});