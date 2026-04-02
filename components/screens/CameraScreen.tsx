import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, moderateScale } from '@/lib/responsive';

import { ResizeMode, Video } from 'expo-av';
import { Camera, CameraView, FlashMode } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
// MediaLibrary import removed - not needed, causes Expo Go Android issues
import { ArrowRight, Camera as CameraIcon, Heart, LogOut, RefreshCw, Sparkles, Video as VideoIcon, X, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';

import {
    Alert,
    Animated,
    DeviceEventEmitter,
    Image,
    Keyboard,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

// Removed AnimatedCamera to fix Android compatibility - using regular CameraView in animated View instead
const MAX_VIDEO_DURATION = 30000; // 30 seconds

interface CameraScreenProps {
    isFocused: boolean;
}

export default function CameraScreen({ isFocused }: CameraScreenProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets(); // STORE_COMPLIANCE: Safe area for notch/dynamic island
    const cameraRef = useRef<CameraView>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const flashAnim = useRef(new Animated.Value(0)).current;

    // Animation explosion succès
    const successAnim = useRef(new Animated.Value(0)).current; // Scale/Opacity global
    const particlesAnim = useRef(new Animated.Value(0)).current; // Pour l'explosion

    const [isCameraReady, setIsCameraReady] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [isCapturing, setIsCapturing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [currentUser, setCurrentUser] = useState<string>('Moi');

    // Media preview states (Snapchat-style)
    const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
    const [capturedMediaType, setCapturedMediaType] = useState<'photo' | 'video'>('photo');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Reset camera ready state quand la caméra se démonte/remonte
    useEffect(() => {
        if (!isFocused || isPreviewMode) {
            setIsCameraReady(false);
        }
    }, [isFocused, isPreviewMode]);
    // A3: Caption input
    const [caption, setCaption] = useState('');
    // Keyboard height tracking for caption input
    const keyboardHeight = useRef(new Animated.Value(0)).current;


    // Keyboard listener: animate bottom area up when keyboard opens
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            Animated.timing(keyboardHeight, {
                toValue: e.endCoordinates.height,
                duration: Platform.OS === 'ios' ? e.duration : 250,
                useNativeDriver: false,
            }).start();
        });
        const hideSub = Keyboard.addListener(hideEvent, (e) => {
            Animated.timing(keyboardHeight, {
                toValue: 0,
                duration: Platform.OS === 'ios' ? (e.duration || 250) : 250,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const userInfo = await AsyncStorage.getItem('wedding_user_info');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.full_name) setCurrentUser(user.full_name);
                }
            } catch (e) {
                if (__DEV__) console.log('Error loading user info in CameraScreen', e);
            }
        })();
    }, []);

    // 🔓 BOUTON DE DÉCONNEXION DEBUG
    const handleLogout = async () => {
        await AsyncStorage.removeItem("wedding_logged_in");
        if (__DEV__) console.log("AsyncStorage cleared");
        router.replace("/welcome");
    };

    useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
            // MediaLibrary permission removed - not needed for Expo Go
            // We upload to Supabase, not save to device gallery
            setHasPermission(
                cameraStatus === 'granted' &&
                audioStatus === 'granted'
            );
        })();
    }, []);

    // Reset ready state when camera unmounts (not focused)
    useEffect(() => {
        if (!isFocused) {
            setIsCameraReady(false);
        }
    }, [isFocused]);

    const switchCamera = () => {
        setFacing(current => current === 'back' ? 'front' : 'back');
    };

    const [focusPos, setFocusPos] = useState({ x: 0, y: 0 });
    const [showFocus, setShowFocus] = useState(false);

    // Reanimated values for manual focus animation
    const focusOpacity = useSharedValue(0);
    const focusScale = useSharedValue(0);
    const focusX = useSharedValue(0);
    const focusY = useSharedValue(0);

    const toggleFlash = () => {
        setFlashMode(current => {
            if (current === 'off') return 'on';
            if (current === 'on') return 'auto';
            return 'off';
        });
    };

    const [flashMode, setFlashMode] = useState<FlashMode>('off');
    // REMOVED: const [zoom, setZoom] = useState(0); -> Now using shared value completely

    // Zoom Handling
    const zoom = useSharedValue(0); // Actual zoom value
    const startZoom = useSharedValue(0); // Zoom value at start of gesture

    const pinch = Gesture.Pinch()
        .onStart(() => {
            startZoom.value = zoom.value;
        })
        .onUpdate((event) => {
            // "Snapchat-like" linear feel: Additive scale often feels better for 0-1 range
            // but let's try a slightly more sensitive approach if needed.
            // Standard linear mapping:
            const newZoom = startZoom.value + (event.scale - 1) * 0.15; // Added multiplier for sensitivity
            zoom.value = Math.max(0, Math.min(newZoom, 1));
        });

    const animatedCameraProps = useAnimatedProps(() => ({
        zoom: zoom.value
    }));


    // Focus Handling
    const tap = Gesture.Tap()
        .onEnd((event) => {
            const { x, y } = event;

            // Update visual indicator position
            focusX.value = x;
            focusY.value = y;

            // Trigger animation
            focusOpacity.value = 1;
            focusScale.value = 1.5;

            focusScale.value = withSpring(1, { damping: 10, stiffness: 100 });

            // Auto hide after delay
            focusOpacity.value = withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0, { duration: 500 })
            );

            // Trigger "focus" by toggling autofocus prop (workaround for expo-camera)
            // But actually CameraView handles focus automatically. 
            // We just ensure it's in auto mode or just let the visual feedback happen as the user expects.
            // Some apps toggle 'autoFocus' prop off/on to force re-focus.
            // For CameraView, simply tapping is often enough if the component supports it, 
            // but we can add the visual indicator at least.
        });

    const compoundGesture = Gesture.Race(pinch, tap);

    const focusIndicatorStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        width: 60,
        height: 60,
        borderWidth: 2,
        borderColor: '#fbbf24', // Amber-400 (Golden/Yellowish like standard focus)
        left: focusX.value - 30, // Center it
        top: focusY.value - 30,
        opacity: focusOpacity.value,
        transform: [{ scale: focusScale.value }]
    }));

    const showFlashEffect = () => {
        Animated.sequence([
            Animated.timing(flashAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(flashAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const showSuccessAnimation = (message: string) => {
        setSuccessMessage(message);
        setShowSuccess(true);

        // Reset particles
        particlesAnim.setValue(0);
        successAnim.setValue(0);

        Animated.parallel([
            // Carte succès
            Animated.sequence([
                Animated.spring(successAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
                Animated.delay(1500),
                Animated.timing(successAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            // Explosion particules
            Animated.timing(particlesAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start(() => setShowSuccess(false));
    };

    const capturePhoto = async () => {
        if (!cameraRef.current || !isCameraReady || isCapturing || isRecording) return;

        setIsCapturing(true);
        showFlashEffect();



        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
            });

            if (photo && photo.uri) {
                // Enter preview mode instead of uploading immediately
                setCapturedPhotoUri(photo.uri);
                setCapturedMediaType('photo');
                setIsPreviewMode(true);
                setIsCapturing(false);
            }
        } catch (error) {
            if (__DEV__) console.error('Erreur capture photo:', error);
            Alert.alert('Erreur', 'Impossible de capturer la photo');
            setIsCapturing(false);
        }
    };

    const uploadPhotoInBackground = async (uri: string, userName: string, photoCaption?: string) => {
        try {
            const { uploadMedia, createPhotoEntry } = await import('@/lib/supabase');
            const imageUrl = await uploadMedia(uri, 'photo');
            await createPhotoEntry(imageUrl, 'photo', userName, photoCaption);
            if (__DEV__) console.log('Photo uploadée avec succès par', userName);
        } catch (error) {
            if (__DEV__) console.error('Erreur upload background:', error);
        }
    };

    // Handle retake (X button)
    const handleRetake = () => {
        setCapturedPhotoUri(null);
        setCapturedMediaType('photo');
        setIsPreviewMode(false);
        setCaption('');
    };

    // Handle send media (Arrow button)
    const handleSend = async () => {
        if (!capturedPhotoUri) return;

        // Get current user name
        let currentUserName = 'Moi';
        try {
            const userInfo = await AsyncStorage.getItem('wedding_user_info');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.full_name) currentUserName = user.full_name;
            }
        } catch (e) {
            if (__DEV__) console.log('Erreur lecture user info:', e);
        }

        const trimmedCaption = caption.trim() || undefined;
        const isVideo = capturedMediaType === 'video';

        // Show success animation
        showSuccessAnimation(isVideo ? 'Vidéo ajoutée au feed ! 🎬' : 'Photo ajoutée au feed ! ✨');

        // Add optimistic update to feed
        DeviceEventEmitter.emit('media.optimistic', {
            id: 'temp-' + Date.now(),
            image_url: capturedPhotoUri,
            media_type: capturedMediaType,
            likes: 0,
            created_at: new Date().toISOString(),
            created_by: currentUserName,
            is_optimistic: true,
            caption: trimmedCaption,
        });

        // Upload in background
        if (isVideo) {
            uploadVideoInBackground(capturedPhotoUri, currentUserName, trimmedCaption);
        } else {
            uploadPhotoInBackground(capturedPhotoUri, currentUserName, trimmedCaption);
        }

        // Exit preview mode
        setCapturedPhotoUri(null);
        setCapturedMediaType('photo');
        setIsPreviewMode(false);
        setCaption('');
    };

    const isPressed = useRef(false);
    const isLongPress = useRef(false);
    const isRecordingActive = useRef(false); // true seulement quand recordAsync() est en cours

    const startRecording = async () => {
        if (__DEV__) console.log('[Video] startRecording called', {
            hasRef: !!cameraRef.current, isCameraReady, isActive: isRecordingActive.current, isPressed: isPressed.current
        });
        if (!cameraRef.current || !isCameraReady || isRecordingActive.current) return;
        if (!isPressed.current) return;

        setIsRecording(true);
        setRecordingProgress(0);

        try {
            const startTime = Date.now();
            recordingTimerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / MAX_VIDEO_DURATION) * 100, 100);
                setRecordingProgress(progress);

                if (elapsed >= MAX_VIDEO_DURATION && isRecordingActive.current) {
                    cameraRef.current?.stopRecording();
                }
            }, 100) as any;

            // Lancer l'enregistrement — cette promesse se résout quand on appelle stopRecording()
            isRecordingActive.current = true;
            if (__DEV__) console.log('[Video] Calling recordAsync...');
            const video = await cameraRef.current.recordAsync({
                maxDuration: MAX_VIDEO_DURATION / 1000,
            });
            isRecordingActive.current = false;
            if (__DEV__) console.log('[Video] recordAsync resolved:', video ? 'got video' : 'no video', video?.uri?.substring(0, 50));

            // Cleanup
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            setIsRecording(false);
            setRecordingProgress(0);

            if (video && video.uri) {
                setCapturedPhotoUri(video.uri);
                setCapturedMediaType('video');
                setIsPreviewMode(true);
            }

        } catch (error: any) {
            if (__DEV__) console.error('[Video] Erreur enregistrement:', error?.message || error);
            isRecordingActive.current = false;
            setIsRecording(false);
            setRecordingProgress(0);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
    };

    const uploadVideoInBackground = async (uri: string, userName: string, videoCaption?: string) => {
        try {
            const { uploadMedia, createPhotoEntry } = await import('@/lib/supabase');
            const videoUrl = await uploadMedia(uri, 'video');
            await createPhotoEntry(videoUrl, 'video', userName, videoCaption);
            if (__DEV__) console.log('Vidéo uploadée avec succès par', userName);
        } catch (error) {
            if (__DEV__) console.error('Erreur upload vidéo:', error);
        }
    };

    const handlePressIn = () => {
        isPressed.current = true;
        isLongPress.current = false;

        longPressTimerRef.current = setTimeout(() => {
            isLongPress.current = true;
            startRecording();
        }, 300);
    };

    const handlePressOut = () => {
        isPressed.current = false;

        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (__DEV__) console.log('[Video] handlePressOut', { isActive: isRecordingActive.current, isLongPress: isLongPress.current });

        if (isRecordingActive.current) {
            // L'enregistrement est en cours via recordAsync — on l'arrête proprement
            if (__DEV__) console.log('[Video] Stopping recording...');
            try {
                cameraRef.current?.stopRecording();
            } catch (e) {
                if (__DEV__) console.error('[Video] Erreur stop:', e);
            }
        } else if (!isLongPress.current && !isCapturing && isCameraReady) {
            capturePhoto();
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>Chargement...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>
                    Accès à la caméra et au microphone requis
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 🔓 BOUTON DEBUG */}
            <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { top: insets.top + 10 }]}>
                <LogOut color="white" size={24} />
            </TouchableOpacity>

            {/* ⚡ BOUTON FLASH */}
            <TouchableOpacity onPress={toggleFlash} style={[styles.flashButton, { top: insets.top + 10 }]}>
                <Zap
                    color={flashMode === 'off' ? 'rgba(255, 255, 255, 0.6)' : 'white'}
                    size={24}
                    fill={flashMode === 'on' ? '#FCD34D' : 'transparent'}
                />
                {flashMode === 'auto' && (
                    <Text style={styles.flashAutoText}>A</Text>
                )}
            </TouchableOpacity>

            {/* FOND DECORATIF (Paillettes qui respirent) */}
            <View style={styles.decorativeContainer}>
                {[...Array(15)].map((_, i) => (
                    <DecorativeElement key={i} index={i} />
                ))}
            </View>

            {/* Header */}
            <View style={[styles.header, { top: insets.top + 10 }]}>
                <Text style={styles.title}>Notre Mariage</Text>
                <View style={styles.headerDivider}>
                    <View style={styles.dividerLine} />
                    <Heart color="#FBB6CE" size={12} fill="#FBB6CE" />
                    <View style={styles.dividerLine} />
                </View>
            </View>

            {/* Camera */}
            {isFocused && !isPreviewMode && (
                <GestureDetector gesture={compoundGesture}>
                    <Reanimated.View style={styles.camera}>
                        <CameraView
                            ref={cameraRef}
                            style={StyleSheet.absoluteFill}
                            facing={facing}
                            mode="video"
                            flash={flashMode}
                            onCameraReady={() => setIsCameraReady(true)}
                        />
                        {/* Manual Focus Indicator */}
                        <Reanimated.View style={focusIndicatorStyle} pointerEvents="none" />
                    </Reanimated.View>
                </GestureDetector>
            )}
            {!isFocused && <View style={[styles.camera, { backgroundColor: '#000' }]} />}

            {/* Frame Overlay - positioned absolutely over camera */}
            {isFocused && (
                <View style={styles.frameOverlay} pointerEvents="none">
                    <View style={[styles.frameCorner, styles.frameCornerTL]} />
                    <View style={[styles.frameCorner, styles.frameCornerTR]} />
                    <View style={[styles.frameCorner, styles.frameCornerBL]} />
                    <View style={[styles.frameCorner, styles.frameCornerBR]} />
                </View>
            )}

            <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} pointerEvents="none" />

            {/* SUCCESS ANIMATION (Explosion + Card) */}
            {showSuccess && (
                <View style={styles.successContainer} pointerEvents="none">
                    {/* EXPLOSION PARTICLES */}
                    {[...Array(12)].map((_, i) => (
                        <ExplosionParticle key={i} index={i} progress={particlesAnim} />
                    ))}

                    <Animated.View style={[
                        styles.successCardWrapper,
                        { opacity: successAnim, transform: [{ scale: successAnim }] }
                    ]}>
                        <View style={styles.successCard}>
                            <Sparkles color="#EC4899" size={48} />
                            <Text style={styles.successText}>{successMessage}</Text>
                            <Text style={styles.successSubtext}>✨ Magnifique ✨</Text>
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* PHOTO PREVIEW (Snapchat-style) */}
            {isPreviewMode && capturedPhotoUri && (
                <View style={styles.previewContainer}>
                    {capturedMediaType === 'video' ? (
                        <Video
                            source={{ uri: capturedPhotoUri }}
                            style={styles.previewImage}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay
                            isLooping
                            isMuted={false}
                        />
                    ) : (
                        <Image
                            source={{ uri: capturedPhotoUri }}
                            style={styles.previewImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Retake Button (X top-left) */}
                    <TouchableOpacity
                        style={[styles.retakeButton, { top: insets.top + 10 }]}
                        onPress={handleRetake}
                        activeOpacity={0.8}
                    >
                        <View style={styles.retakeButtonInner}>
                            <X size={28} color="white" strokeWidth={2.5} />
                        </View>
                    </TouchableOpacity>

                    {/* Caption + Send row at bottom — animated up when keyboard opens */}
                    <Animated.View style={[styles.previewBottomArea, {
                        paddingBottom: 80 + insets.bottom + 16,
                        transform: [{ translateY: Animated.multiply(keyboardHeight, -1) }],
                    }]}>
                        {/* A3: Caption Input */}
                        <View style={styles.captionInputContainer}>
                            <View style={styles.captionInputBackground}>
                                <TextInput
                                    style={styles.captionInput}
                                    placeholder="Ajouter une légende..."
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={caption}
                                    onChangeText={setCaption}
                                    maxLength={200}
                                    returnKeyType="done"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                />
                            </View>
                        </View>

                        {/* Send Button */}
                        <TouchableOpacity
                            onPress={handleSend}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#F472B6', '#EC4899', '#C084FC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.sendGradient}
                            >
                                <ArrowRight size={28} color="white" strokeWidth={2.5} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}

            {/* CONTROLS */}
            <View style={[styles.controlsContainer, { bottom: 80 + insets.bottom }]}>
                <TouchableOpacity onPress={switchCamera} style={styles.switchButton}>
                    <RefreshCw color="white" size={24} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isCapturing}
                    style={styles.captureButtonContainer}
                    activeOpacity={0.9}
                >
                    {/* Sparkles autour du bouton (si pas en train d'enregistrer) */}
                    {!isRecording && [...Array(6)].map((_, i) => (
                        <ButtonSparkle key={i} index={i} />
                    ))}

                    {/* Progress Ring */}
                    {isRecording && (
                        <View style={styles.progressRing}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { transform: [{ rotate: `${(recordingProgress / 100) * 360}deg` }] }
                                ]}
                            />
                        </View>
                    )}

                    {/* SHUTTER BUTTON AVEC GRADIENT */}
                    <View style={[styles.captureButtonWrapper, isRecording && styles.captureButtonWrapperRec]}>
                        <LinearGradient
                            colors={isRecording
                                ? ['#FECACA', '#FFFFFF', '#FECACA'] // Red-200, White, Red-200
                                : ['#FCE7F3', '#FFFFFF', '#F3E8FF'] // Pink-100, White, Purple-100
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientOuter}
                        >
                            <LinearGradient
                                colors={isRecording
                                    ? ['#F87171', '#FCA5A5', '#FB7185'] // Red-400, Red-300, Rose-400
                                    : ['#F472B6', '#FDA4AF', '#C084FC'] // Pink-400, Rose-300, Purple-400
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    styles.gradientInner,
                                    (isCapturing || isRecording) && styles.gradientInnerPressed
                                ]}
                            >
                                {isRecording ? (
                                    <VideoIcon color="white" size={32} />
                                ) : (
                                    <CameraIcon color="white" size={32} />
                                )}
                            </LinearGradient>
                        </LinearGradient>
                    </View>
                </TouchableOpacity>

                <View style={styles.placeholder} />
            </View>

        </View>
    );
}

// ---------------------- ANIMATED COMPONENTS ----------------------

// 1. PARTICULES DECORATIVES RESPIRANTES
const DecorativeElement: React.FC<{ index: number }> = ({ index }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const delay = Math.random() * 2000;
        const duration = 3000 + Math.random() * 2000;

        Animated.loop(
            Animated.sequence([
                Animated.delay(delay), // Délai aléatoire
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                    toValue: 0,
                    duration: duration,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateY = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -20, 0], // Monte et descend
    });

    const opacity = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.8, 0.3], // Respire
    });

    const scale = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 1.1, 0.8], // Grossit et rétrécit
    });

    const randomTop = Math.random() * 40; // Reste en haut
    const randomLeft = Math.random() * 100;

    return (
        <Animated.View
            style={[
                styles.decorativeElement,
                {
                    top: `${randomTop}%`,
                    left: `${randomLeft}%`,
                    opacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            {index % 3 === 0 ? (
                <Sparkles color="#F9A8D4" size={16} />
            ) : index % 3 === 1 ? (
                <Heart color="#FDA4AF" size={12} fill="#FDA4AF" />
            ) : (
                <View style={styles.decorativeCircle} /> // div circulaire violette
            )}
        </Animated.View>
    );
};

// 2. PAILLETTES AUTOUR DU BOUTON
const ButtonSparkle: React.FC<{ index: number }> = ({ index }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(index * 200),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const angle = (index * 60) * (Math.PI / 180); // 6 particules réparties
    const radius = 55; // Rayon autour du bouton (bouton fait 80/2 = 40 + marge)

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * 10], // Bouge légèrement vers l'extérieur
    });

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * 10],
    });

    const opacity = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0],
    });

    const scale = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1, 0.5],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: 40 + Math.cos(angle) * (radius - 5), // Centre (40) + offset
                top: 40 + Math.sin(angle) * (radius - 5),
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
            }}
        >
            <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: index % 2 === 0 ? '#F9A8D4' : '#C4B5FD'
            }} />
        </Animated.View>
    );
};

// 3. EXPLOSION PARTICLES
const ExplosionParticle: React.FC<{ index: number, progress: Animated.Value }> = ({ index, progress }) => {
    const angle = (index * 30) * (Math.PI / 180); // 12 particules
    const maxDist = 150;

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * maxDist],
    });

    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * maxDist],
    });

    const scale = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1.5, 0],
    });

    const opacity = progress.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                // Centré
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
            }}
        >
            {index % 3 === 0 ? (
                <Heart color="#F472B6" size={24} fill="#F472B6" />
            ) : index % 3 === 1 ? (
                <Sparkles color="#E879F9" size={24} />
            ) : (
                <LinearGradient
                    colors={['#F472B6', '#C084FC']}
                    style={{ width: 12, height: 12, borderRadius: 6 }}
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    logoutButton: {
        position: 'absolute',
        top: 60, // Aligné avec le header
        right: 24,
        zIndex: 50,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        // Ombre portée pour lisibilité vidéo
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3,
    },
    flashButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        zIndex: 50,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3,
    },
    flashAutoText: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: '#EC4899',
        borderRadius: 8,
        width: 16,
        height: 16,
        textAlign: 'center',
        lineHeight: 16,
    },
    decorativeContainer: {
        position: 'absolute',
        top: 0,
        left: 0, right: 0, bottom: 0,
        zIndex: 10,
        pointerEvents: 'none',
    },
    decorativeElement: {
        position: 'absolute',
    },
    decorativeCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#D8B4FE', // Purple-300
        opacity: 0.4,
    },
    header: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 20,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: moderateScale(24),
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.9)',
        letterSpacing: 3,
    },
    headerDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    dividerLine: {
        width: 32,
        height: 1,
        backgroundColor: '#FBB6CE',
    },
    frameOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 16,
        borderRadius: 24,
        zIndex: 15,
    },
    frameCorner: { position: 'absolute', width: 48, height: 48 },
    frameCornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(251, 182, 206, 0.5)', borderTopLeftRadius: 24 },
    frameCornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderColor: 'rgba(251, 182, 206, 0.5)', borderTopRightRadius: 24 },
    frameCornerBL: { bottom: 120, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(196, 181, 253, 0.5)', borderBottomLeftRadius: 24 },
    frameCornerBR: { bottom: 120, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(196, 181, 253, 0.5)', borderBottomRightRadius: 24 },

    flashOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'white', zIndex: 30,
    },

    successContainer: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCardWrapper: {
        // Wrapper animated
    },
    successCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        paddingHorizontal: 32,
        paddingVertical: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        elevation: 8,
    },
    successText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#1F2937',
        marginTop: 8,
    },
    successSubtext: {
        fontSize: 14,
        color: '#EC4899',
        marginTop: 4,
    },

    controlsContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: scale(32),
        paddingHorizontal: scale(24),
        zIndex: 20,
    },
    switchButton: {
        width: scale(56), height: scale(56), borderRadius: scale(28),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    captureButtonContainer: {
        width: scale(80), height: scale(80),
        justifyContent: 'center', alignItems: 'center',
        position: 'relative',
    },
    captureButtonWrapper: {
        width: scale(80), height: scale(80),
        borderRadius: scale(40),
        overflow: 'hidden', // Pour clipping le gradient
        // Padding is inside gradientOuter
    },
    captureButtonWrapperRec: {
        // maybe slight scale
    },
    gradientOuter: {
        width: '100%', height: '100%',
        justifyContent: 'center', alignItems: 'center',
        padding: 4, // Bordure simulée
    },
    gradientInner: {
        flex: 1,
        width: '100%',
        borderRadius: 36,
        justifyContent: 'center', alignItems: 'center',
    },
    gradientInnerPressed: {
        transform: [{ scale: 0.85 }],
    },
    progressRing: {
        position: 'absolute', width: scale(96), height: scale(96), borderRadius: scale(48),
        borderWidth: 4, borderColor: 'rgba(248, 113, 113, 0.3)',
        top: -8, left: -8,
    },
    progressFill: {
        width: '100%', height: '100%', borderRadius: 48,
        borderWidth: 4, borderColor: '#F87171',
        borderRightColor: 'transparent', borderBottomColor: 'transparent',
    },
    placeholder: { width: 56, height: 56 },
    permissionText: { color: 'white', fontSize: 16, textAlign: 'center', flex: 1, textAlignVertical: 'center' },

    // Photo Preview Styles
    previewContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 50,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    retakeButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        zIndex: 60,
    },
    retakeButtonInner: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    previewBottomArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: scale(24),
        gap: 12,
    },
    // A3: Caption Input styles
    captionInputContainer: {
        flex: 1,
    },
    captionInputBackground: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    captionInput: {
        color: 'white',
        fontSize: 16,
        fontWeight: '400',
    },
    sendGradient: {
        width: scale(64),
        height: scale(64),
        borderRadius: scale(32),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F472B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
});
