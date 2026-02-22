// app/(tabs)/feed.tsx - ULTRA PREMIUM VERSION
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import { deleteAccount, signOut, supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import {
    BadgeCheck,
    Bookmark,
    Clock,
    Copy,
    Crown,
    Download,
    Heart,
    ImageOff,
    LogOut,
    MoreVertical,
    Play,
    Settings,
    Share2,
    Sparkles,
    Star,
    Trash2,
    User,
    X
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    DeviceEventEmitter,
    Dimensions,
    Easing,
    Modal,
    PanResponder,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, moderateScale } from '@/lib/responsive';

const { width, height } = Dimensions.get('window');

interface Photo {
    id: string;
    image_url: string;
    media_type: 'photo' | 'video';
    likes: number;
    liked_by: string[];
    created_at: string;
    created_by?: string;
    caption?: string;
}

// Shimmer Loading Effect
const ShimmerEffect: React.FC<{ style: ViewStyle }> = ({ style }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const shimmerTranslate = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[style, { backgroundColor: '#F3E8FF', overflow: 'hidden', borderRadius: 20 }]}>
            <Animated.View
                style={{
                    ...StyleSheet.absoluteFillObject,
                    transform: [{ translateX: shimmerTranslate }],
                }}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                />
            </Animated.View>
        </View>
    );
};

// Golden Floating Particle - NOW ACTIVE
const FloatingParticle: React.FC<{
    x: number;
    yStart: number;
    size: number;
    duration: number;
    icon: string;
    delay: number;
}> = ({ x, yStart, size, duration, icon, delay }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const rotation = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.loop(
                Animated.sequence([
                    Animated.timing(translateY, {
                        toValue: -height - 100,
                        duration: duration,
                        delay,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(translateX, {
                        toValue: 20,
                        duration: duration / 3,
                        easing: Easing.bezier(0.45, 0, 0.55, 1),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: -20,
                        duration: duration / 3,
                        easing: Easing.bezier(0.45, 0, 0.55, 1),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: duration / 3,
                        easing: Easing.bezier(0.45, 0, 0.55, 1),
                        useNativeDriver: true,
                    }),
                ])
            ),
            Animated.loop(
                Animated.timing(rotation, {
                    toValue: 1,
                    duration: duration / 2,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.9,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.3,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1.2,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 0.8,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            ),
        ]).start();
    }, []);

    const rotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: x,
                top: yStart,
                transform: [{ translateY }, { translateX }, { rotate }, { scale }],
                opacity,
            }}
        >
            {icon === 'star' ? (
                <Star size={size} color="#FFD700" fill="#FFD700" />
            ) : icon === 'heart' ? (
                <Heart size={size} color="#F4E4C1" fill="#F4E4C1" />
            ) : (
                <Sparkles size={size} color="#E8C4B8" />
            )}
        </Animated.View>
    );
};

// Enhanced Confetti with 50+ particles
const MassiveConfettiParticle: React.FC<{
    index: number;
    progress: Animated.Value;
    totalParticles: number;
}> = ({ index, progress, totalParticles }) => {
    const angle = (index * (360 / totalParticles)) * (Math.PI / 180);
    const velocity = 0.5 + Math.random() * 0.8;
    const maxDist = 100 + Math.random() * 100;
    const colors = ['#F43F5E', '#EC4899', '#C084FC', '#FFD700', '#FCA5A5', '#DDD6FE', '#F4E4C1'];
    const color = colors[index % colors.length];
    const rotationSpeed = 1 + Math.random() * 2;

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * maxDist * velocity],
    });

    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * maxDist * velocity + 50],
    });

    const scale = progress.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, 1.8, 0],
    });

    const opacity = progress.interpolate({
        inputRange: [0, 0.1, 0.8, 1],
        outputRange: [0, 1, 1, 0],
    });

    const rotate = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${360 * rotationSpeed}deg`],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
                opacity,
            }}
        >
            {index % 4 === 0 ? (
                <Heart color={color} size={14} fill={color} />
            ) : index % 4 === 1 ? (
                <Sparkles color={color} size={14} />
            ) : index % 4 === 2 ? (
                <Star color={color} size={12} fill={color} />
            ) : (
                <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: color,
                }} />
            )}
        </Animated.View>
    );
};

// Scale Button Component
const ScaleButton: React.FC<{
    onPress?: () => void;
    style?: ViewStyle;
    children: React.ReactNode;
    disabled?: boolean;
}> = ({ onPress, style, children, disabled }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scale, {
            toValue: 0.92,
            friction: 4,
            tension: 100,
            useNativeDriver: true
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true
        }).start();
    };

    return (
        <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled}
        >
            <Animated.View
                style={[style, { transform: [{ scale }] }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                {children}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

// Premium Hero Header - RESTORED ORIGINAL
const PremiumHeroHeader: React.FC<{
    insetTop: number;
    totalPhotos: number;
}> = ({ insetTop, totalPhotos }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const counterScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    easing: Easing.bezier(0.45, 0, 0.55, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.bezier(0.45, 0, 0.55, 1),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        // Animation when totalPhotos changes
        Animated.sequence([
            Animated.spring(counterScale, {
                toValue: 1.15,
                tension: 100,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(counterScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, [totalPhotos]);

    return (
        <View>
            <PremiumHeader
                insetTop={insetTop}
                title="NOTRE MARIAGE"
                subtitle="Partagez vos moments ✨"
            />

            {/* Photo Counter - BELOW HEADER */}
            <Animated.View style={[styles.photoCounter, { transform: [{ scale: counterScale }] }]}>
                <LinearGradient
                    colors={['rgba(249, 168, 212, 0.2)', 'rgba(192, 132, 252, 0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.photoCounterGradient}
                >
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Heart size={16} color="#F43F5E" fill="#F43F5E" />
                    </Animated.View>
                    <Text style={styles.photoCounterText}>{totalPhotos}</Text>
                    <Text style={styles.photoCounterLabel}>
                        moment{totalPhotos > 1 ? 's' : ''} capturé{totalPhotos > 1 ? 's' : ''}
                    </Text>
                </LinearGradient>
            </Animated.View>
        </View>
    );
};

// Premium Post Card with Glassmorphism
const PremiumPostCard: React.FC<{
    photo: Photo;
    currentUser: string | null;
    onLike: () => void;
    onPress: () => void;
    isNew?: boolean;
    onAnimationComplete?: () => void;
    index: number;
}> = ({ photo, currentUser, onLike, onPress, isNew = false, onAnimationComplete, index }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [showConfetti, setShowConfetti] = useState(isNew);

    const opacityAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const heartScale = useRef(new Animated.Value(0)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;
    const confettiProgress = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(1)).current;
    const lastTap = useRef<number | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Staggered entrance animation
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                delay: index * 100,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        if (isNew && showConfetti) {
            Animated.timing(confettiProgress, {
                toValue: 1,
                duration: 2000,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }).start(() => {
                setShowConfetti(false);
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            });
        }
    }, [isNew, showConfetti]);

    const hasUserLiked = (photo.liked_by || []).includes(currentUser || 'anonymous');

    const handleLoad = () => {
        setIsImageLoaded(true);
    };

    const showHeartAnimation = () => {
        heartScale.setValue(0);
        heartOpacity.setValue(1);
        Animated.parallel([
            Animated.spring(heartScale, { toValue: 1.2, friction: 3, useNativeDriver: true }),
            Animated.sequence([
                Animated.delay(300),
                Animated.timing(heartOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
        ]).start();
    };

    const handlePress = () => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;

        if (isSharing) return;

        if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
            if (timer.current) clearTimeout(timer.current);
            lastTap.current = null;
            if (!hasUserLiked) {
                onLike();
                showHeartAnimation();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } else {
            lastTap.current = now;
            timer.current = setTimeout(() => {
                onPress();
                lastTap.current = null;
            }, DOUBLE_PRESS_DELAY);
        }
    };

    const handleLikePress = () => {
        if (timer.current) clearTimeout(timer.current);
        lastTap.current = null;
        onLike();
        if (!hasUserLiked) {
            showHeartAnimation();
        }
    };

    const handleShare = async () => {
        if (timer.current) clearTimeout(timer.current);
        if (isSharing) return;

        setIsSharing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const filename = `share_${photo.id}.${photo.media_type === 'video' ? 'mp4' : 'jpg'}`;
            const cacheDir = (FileSystem as any).cacheDirectory;
            const fileUri = `${cacheDir}${filename}`;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            let uri = fileUri;

            if (!fileInfo.exists) {
                const downloadRes = await FileSystem.downloadAsync(photo.image_url, fileUri);
                uri = downloadRes.uri;
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    dialogTitle: 'Partager ce souvenir',
                    UTI: photo.media_type === 'video' ? 'public.movie' : 'public.image',
                    mimeType: photo.media_type === 'video' ? 'video/mp4' : 'image/jpeg'
                });
            } else {
                Alert.alert("Info", "Le partage n'est pas disponible sur cet appareil.");
            }
        } catch (error) {
            if (__DEV__) console.log('Share error:', error);
            try {
                await Sharing.shareAsync(photo.image_url);
            } catch (e) {
                Alert.alert('Oups', 'Impossible de partager pour le moment');
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handleBookmark = () => {
        Haptics.selectionAsync();
        setIsBookmarked(!isBookmarked);
    };

    const getTimeAgo = (date: string) => {
        try {
            const now = new Date();
            const photoDate = new Date(date);
            const seconds = Math.floor((now.getTime() - photoDate.getTime()) / 1000);

            if (seconds < 60) return "À l'instant";
            if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
            if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
            return `Il y a ${Math.floor(seconds / 86400)} j`;
        } catch {
            return "À l'instant";
        }
    };

    return (
        <Animated.View
            style={[
                styles.premiumPostCard,
                {
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }, { scale: cardScale }],
                }
            ]}
        >
            {/* Massive Confetti (50 particles) */}
            {showConfetti && (
                <View style={styles.confettiContainer} pointerEvents="none">
                    {[...Array(50)].map((_, i) => (
                        <MassiveConfettiParticle
                            key={i}
                            index={i}
                            progress={confettiProgress}
                            totalParticles={50}
                        />
                    ))}
                </View>
            )}

            {/* Post Header */}
            <View style={styles.postHeader}>
                <View style={styles.postHeaderLeft}>
                    <LinearGradient
                        colors={['#F9A8D4', '#D8B4FE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                    >
                        <User size={20} color="white" />
                    </LinearGradient>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.username}>
                                {photo.created_by?.split('@')[0] || 'Invité'}
                            </Text>
                            {(photo.created_by?.includes('Anne-Marie') ||
                                photo.created_by?.includes('Jean-Jacques')) ? (
                                <Crown size={14} color="#FFD700" fill="#FFD700" />
                            ) : photo.created_by?.includes('Camille') ? (
                                <Star size={14} color="#FFA500" fill="#FFA500" />
                            ) : (
                                <BadgeCheck size={14} color="#3B82F6" />
                            )}
                        </View>
                        <View style={styles.timeContainer}>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.timeText}>{getTimeAgo(photo.created_at)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Media Container - Full Width */}
            <TouchableWithoutFeedback onPress={handlePress}>
                <View style={styles.mediaContainer}>
                    {!isImageLoaded && (
                        <ShimmerEffect style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    )}

                    {photo.media_type === 'video' ? (
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Video
                                source={{ uri: photo.image_url }}
                                style={styles.media}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={false}
                                isMuted={true}
                                onLoad={handleLoad}
                            />
                            <View style={styles.videoBadge}>
                                <Play size={16} color="white" fill="white" />
                                <Text style={styles.videoBadgeText}>Vidéo</Text>
                            </View>
                        </View>
                    ) : (
                        <Image
                            source={{ uri: photo.image_url }}
                            style={styles.media}
                            contentFit="cover"
                            transition={300}
                            cachePolicy="memory-disk"
                            onLoad={handleLoad}
                        />
                    )}

                    {/* Heart Animation */}
                    <Animated.View
                        style={[
                            styles.heartAnimation,
                            {
                                transform: [{ scale: heartScale }],
                                opacity: heartOpacity,
                            },
                        ]}
                        pointerEvents="none"
                    >
                        <Heart size={100} color="white" fill="white" />
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>

            {/* Actions Bar */}
            <View style={styles.actionsBar}>
                <View style={styles.actionsLeft}>
                    <ScaleButton onPress={handleLikePress} style={styles.actionButton}>
                        <Heart
                            size={28}
                            color={hasUserLiked ? '#EC4899' : '#1F2937'}
                            fill={hasUserLiked ? '#EC4899' : 'transparent'}
                            strokeWidth={2}
                        />
                    </ScaleButton>

                    <ScaleButton onPress={handleShare} style={styles.actionButton} disabled={isSharing}>
                        {isSharing ? (
                            <ActivityIndicator size="small" color="#1F2937" />
                        ) : (
                            <Share2 size={28} color="#1F2937" strokeWidth={2} />
                        )}
                    </ScaleButton>
                </View>

                <ScaleButton onPress={handleBookmark} style={styles.actionButton}>
                    <Bookmark
                        size={24}
                        color={isBookmarked ? '#DB2777' : '#1F2937'}
                        fill={isBookmarked ? '#DB2777' : 'transparent'}
                        strokeWidth={2}
                    />
                </ScaleButton>
            </View>

            {/* Likes */}
            {(photo.likes || 0) > 0 && (
                <View style={styles.likesSection}>
                    <Text style={styles.likesText}>
                        <Text style={styles.likesBold}>{photo.likes}</Text>{' '}
                        {photo.likes === 1 ? 'personne aime' : 'personnes aiment'} ça
                    </Text>
                </View>
            )}

            {/* Caption */}
            <View style={styles.captionSection}>
                <Text style={styles.captionText}>
                    <Text style={styles.captionUsername}>
                        {photo.created_by?.split('@')[0] || 'Invité'}
                    </Text>{' '}
                    {photo.caption || 'Un moment magique de notre célébration ✨💕'}
                </Text>
            </View>
        </Animated.View>
    );
};

// Photo Modal (keep existing)
const PhotoModal: React.FC<{
    photo: Photo;
    onClose: () => void;
    onLike: () => void;
    hasUserLiked: boolean;
    navigatePhoto: (direction: 'left' | 'right') => void;
    canSwipeLeft: boolean;
    canSwipeRight: boolean;
}> = ({ photo, onClose, onLike, hasUserLiked, navigatePhoto, canSwipeLeft, canSwipeRight }) => {
    const insets = useSafeAreaInsets();
    const [showOptions, setShowOptions] = useState(false);
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const bgOpacityAnim = useRef(new Animated.Value(0)).current;

    const bgOpacity = translateY.interpolate({
        inputRange: [0, height * 0.5],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        StatusBar.setHidden(true);
        translateX.setValue(0);
        translateY.setValue(0);
        Animated.timing(bgOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        return () => StatusBar.setHidden(false);
    }, [photo.id]);

    const handleSave = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
                await MediaLibrary.saveToLibraryAsync(photo.image_url);
                Alert.alert('Succès', 'Photo enregistrée dans la galerie !');
                setShowOptions(false);
            } else {
                Alert.alert('Erreur', 'Permission refusée');
            }
        } catch (e) {
            Alert.alert('Erreur', "Impossible d'enregistrer la photo");
        }
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(photo.image_url);
        Alert.alert('Copié', 'Lien de la photo copié !');
        setShowOptions(false);
    };

    const handleShare = async () => {
        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(photo.image_url);
                setShowOptions(false);
            } else {
                Alert.alert('Info', 'Partage indisponible');
            }
        } catch (e) {
            Alert.alert('Erreur', 'Impossible de partager');
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
            onPanResponderMove: (_, g) => {
                if (Math.abs(g.dy) > Math.abs(g.dx) && g.dy > 0) {
                    translateY.setValue(g.dy);
                } else if (Math.abs(g.dx) > Math.abs(g.dy)) {
                    translateX.setValue(g.dx);
                }
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 120 && Math.abs(g.dy) > Math.abs(g.dx)) {
                    Animated.timing(translateY, {
                        toValue: height,
                        duration: 250,
                        useNativeDriver: true,
                    }).start(onClose);
                } else if (g.dx > 100 && canSwipeLeft) {
                    Animated.timing(translateX, { toValue: width, duration: 200, useNativeDriver: true }).start(() => {
                        translateX.setValue(0);
                        navigatePhoto('left');
                    });
                } else if (g.dx < -100 && canSwipeRight) {
                    Animated.timing(translateX, { toValue: -width, duration: 200, useNativeDriver: true }).start(() => {
                        translateX.setValue(0);
                        navigatePhoto('right');
                    });
                } else {
                    Animated.parallel([
                        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
                        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
                    ]).start();
                }
            },
        })
    ).current;

    const handleClose = () => {
        Animated.timing(bgOpacityAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    return (
        <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
            <Animated.View style={[styles.modalContainer, { opacity: Animated.multiply(bgOpacityAnim, bgOpacity) }]}>
                <Animated.View
                    style={[
                        styles.modalContentWrapper,
                        { transform: [{ translateX }, { translateY }] },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <ScrollView
                        maximumZoomScale={3}
                        minimumZoomScale={1}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        centerContent
                        contentContainerStyle={{ width, height, justifyContent: 'center' }}
                    >
                        {photo.media_type === 'video' ? (
                            <Video
                                source={{ uri: photo.image_url }}
                                style={{ width, height }}
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                                isLooping
                                useNativeControls
                            />
                        ) : (
                            <Image
                                source={{ uri: photo.image_url }}
                                style={{ width, height }}
                                contentFit="contain"
                            />
                        )}
                    </ScrollView>
                </Animated.View>

                <View style={styles.modalVignette} pointerEvents="none" />

                <Animated.View style={[styles.modalHeader, { opacity: bgOpacityAnim, top: insets.top + 10 }]}>
                    <TouchableOpacity style={styles.iconButtonBlur} onPress={handleClose}>
                        <BlurView intensity={30} tint="dark" style={styles.iconBlur}>
                            <X color="white" size={24} />
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButtonBlur} onPress={() => setShowOptions(true)}>
                        <BlurView intensity={30} tint="dark" style={styles.iconBlur}>
                            <MoreVertical color="white" size={24} />
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.modalBottomBar}>
                    <BlurView intensity={80} tint="dark" style={styles.bottomBarBlur}>
                        <View style={[styles.bottomBarContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
                            <View style={styles.userSection}>
                                <Text style={styles.userName}>Invité</Text>
                                <Text style={styles.photoTime}>Il y a quelques instants</Text>
                            </View>
                            <TouchableOpacity
                                onPress={onLike}
                                style={[
                                    styles.modalLikeButton,
                                    hasUserLiked && styles.modalLikeButtonActive,
                                ]}
                            >
                                <Heart
                                    color={hasUserLiked ? '#EC4899' : 'white'}
                                    size={24}
                                    fill={hasUserLiked ? '#EC4899' : 'transparent'}
                                />
                                {photo.likes > 0 && (
                                    <Text
                                        style={[
                                            styles.modalLikeText,
                                            hasUserLiked && styles.modalLikeTextActive,
                                        ]}
                                    >
                                        {photo.likes}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>

                <Modal
                    visible={showOptions}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowOptions(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
                        <View style={styles.optionsOverlay}>
                            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={[styles.optionsMenu, { paddingBottom: insets.bottom + 16 }]}>
                                <TouchableOpacity style={styles.optionItem} onPress={handleSave}>
                                    <Download color="#1F2937" size={20} />
                                    <Text style={styles.optionText}>Enregistrer la photo</Text>
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.optionItem} onPress={handleCopy}>
                                    <Copy color="#1F2937" size={20} />
                                    <Text style={styles.optionText}>Copier le lien</Text>
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
                                    <Share2 color="#1F2937" size={20} />
                                    <Text style={styles.optionText}>Partager</Text>
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => setShowOptions(false)}
                                >
                                    <X color="#EF4444" size={20} />
                                    <Text style={[styles.optionText, { color: '#EF4444' }]}>Annuler</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </Animated.View>
        </Modal>
    );
};

// Main Feed Component
export default function FeedScreen() {
    const router = useRouter();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [seenPhotoIds, setSeenPhotoIds] = useState<Set<string>>(new Set());
    const [newPhotoIds, setNewPhotoIds] = useState<Set<string>>(new Set());
    // STORE_COMPLIANCE: Settings modal for account management (logout + delete)
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const init = async () => {
            const seenIds = await loadSeenPhotos();
            getCurrentUser();
            initialLoad(seenIds);
        };
        init();
        const cleanup = setupRealtimeSubscription();

        const subscription = DeviceEventEmitter.addListener('media.optimistic', (newItem: any) => {
            if (__DEV__) console.log('Optimistic update received', newItem.media_type);
            setPhotos((prev) => [newItem, ...prev]);
            setTotalCount((prev) => prev + 1);
            setNewPhotoIds(prevNew => new Set(prevNew).add(newItem.id));
        });

        return () => {
            cleanup();
            subscription.remove();
        };
    }, []);

    // A1: Emit unseen photo count for BottomNav badge
    useEffect(() => {
        DeviceEventEmitter.emit('feed.unseenCount', newPhotoIds.size);
    }, [newPhotoIds]);

    const setupRealtimeSubscription = () => {
        const channel = supabase
            .channel('public:photos')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'photos' },
                (payload) => {
                    const newPhoto = payload.new as Photo;
                    let incrementCount = true;

                    setPhotos((prev) => {
                        if (prev.find((p) => p.id === newPhoto.id)) {
                            incrementCount = false;
                            return prev;
                        }

                        const optimisticIndex = prev.findIndex(p => (p as any).is_optimistic && p.media_type === newPhoto.media_type);

                        if (optimisticIndex !== -1 && optimisticIndex < 3) {
                            const newPhotos = [...prev];
                            newPhotos[optimisticIndex] = newPhoto;
                            incrementCount = false;
                            return newPhotos;
                        }

                        return [newPhoto, ...prev];
                    });

                    setNewPhotoIds(prevNew => new Set(prevNew).add(newPhoto.id));

                    if (incrementCount) {
                        setTotalCount((prev) => prev + 1);
                    }
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'photos' },
                () => setTotalCount((prev) => Math.max(0, prev - 1))
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'photos' },
                (payload) => {
                    if (__DEV__) console.log('REALTIME UPDATE RECEIVED:', payload);
                    const updated = payload.new as Photo;
                    if (__DEV__) console.log('Updated photo data:', updated);
                    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }
            )
            .subscribe((status) => {
                if (__DEV__) console.log(`REALTIME CONNECTION STATUS: ${status}`);
                if (status === 'SUBSCRIBED') {
                    if (__DEV__) console.log('Connected to photos channel');
                }
                if (status === 'CHANNEL_ERROR') {
                    if (__DEV__) console.error('Realtime channel error');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const getCurrentUser = async () => {
        try {
            const userInfo = await AsyncStorage.getItem('wedding_user_info');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                setCurrentUser(user.full_name || 'anonymous');
                setCurrentUserEmail(user.email || null);
            } else {
                setCurrentUser('anonymous');
                setCurrentUserEmail(null);
            }
        } catch (error) {
            if (__DEV__) console.error('Erreur getCurrentUser:', error);
            setCurrentUser('anonymous');
            setCurrentUserEmail(null);
        }
    };

    // STORE_COMPLIANCE: Logout handler
    const handleLogout = async () => {
        try {
            await signOut();
            await AsyncStorage.removeItem('wedding_logged_in');
            await AsyncStorage.removeItem('wedding_user_info');
            setShowSettingsModal(false);
            router.replace('/welcome');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
        }
    };

    // STORE_COMPLIANCE: Account deletion handler - Required by Apple since June 2022
    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer mon compte',
            'Cette action est irréversible. Vos photos resteront visibles mais seront anonymisées. Voulez-vous vraiment supprimer votre compte ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        if (!currentUserEmail) {
                            Alert.alert('Erreur', 'Impossible de récupérer les informations du compte.');
                            return;
                        }
                        setIsDeletingAccount(true);
                        try {
                            await deleteAccount(currentUserEmail);
                            await AsyncStorage.removeItem('wedding_logged_in');
                            await AsyncStorage.removeItem('wedding_user_info');
                            await AsyncStorage.removeItem('wedding_seen_photos');
                            setShowSettingsModal(false);
                            router.replace('/welcome');
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer le compte. Veuillez réessayer.');
                        } finally {
                            setIsDeletingAccount(false);
                        }
                    }
                }
            ]
        );
    };

    const loadSeenPhotos = async (): Promise<Set<string>> => {
        try {
            const seenData = await AsyncStorage.getItem('wedding_seen_photos');
            if (seenData) {
                const seenArray: string[] = JSON.parse(seenData);
                const seenSet = new Set<string>(seenArray);
                setSeenPhotoIds(seenSet);
                return seenSet;
            }
        } catch (error) {
            if (__DEV__) console.error('Error loading seen photos:', error);
        }
        return new Set<string>();
    };

    const markPhotoAsSeen = async (photoId: string) => {
        try {
            const updatedSeen = new Set(seenPhotoIds);
            updatedSeen.add(photoId);
            setSeenPhotoIds(updatedSeen);
            setNewPhotoIds(prev => {
                const updated = new Set(prev);
                updated.delete(photoId);
                return updated;
            });
            await AsyncStorage.setItem('wedding_seen_photos', JSON.stringify(Array.from(updatedSeen)));
        } catch (error) {
            if (__DEV__) console.error('Error marking photo as seen:', error);
        }
    };

    const initialLoad = async (seenIds?: Set<string>) => {
        setIsLoading(true);
        const [countRes, dataRes] = await Promise.all([
            supabase.from('photos').select('*', { count: 'exact', head: true }),
            supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

        if (countRes.count !== null) setTotalCount(countRes.count);
        if (dataRes.data) {
            const loadedPhotos = dataRes.data as Photo[];
            setPhotos(loadedPhotos);

            const idsToCheck = seenIds || seenPhotoIds;
            const newIds = new Set<string>();
            loadedPhotos.forEach(photo => {
                if (!idsToCheck.has(photo.id)) {
                    newIds.add(photo.id);
                }
            });
            setNewPhotoIds(newIds);
        }

        setIsLoading(false);
        setRefreshing(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        initialLoad();
    };

    const toggleLike = async (photo: Photo) => {
        try {
            const userEmail = currentUser || 'anonymous';
            const likedBy = photo.liked_by || [];
            const hasLiked = likedBy.includes(userEmail);
            const newLikedBy = hasLiked ? likedBy.filter((e) => e !== userEmail) : [...likedBy, userEmail];

            const updatedPhoto = { ...photo, likes: newLikedBy.length, liked_by: newLikedBy };
            setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updatedPhoto : p)));

            await supabase
                .from('photos')
                .update({ likes: newLikedBy.length, liked_by: newLikedBy })
                .eq('id', photo.id);
        } catch (error) {
            if (__DEV__) console.error(error);
        }
    };

    const hasUserLiked = (photo: Photo) => {
        const userEmail = currentUser || 'anonymous';
        return (photo.liked_by || []).includes(userEmail);
    };

    const renderItem = ({ item, index }: { item: Photo; index: number }) => (
        <PremiumPostCard
            photo={item}
            currentUser={currentUser}
            onLike={() => toggleLike(item)}
            onPress={() => setSelectedPhotoIndex(index)}
            isNew={newPhotoIds.has(item.id)}
            onAnimationComplete={() => markPhotoAsSeen(item.id)}
            index={index}
        />
    );

    // A4: Grid mode renderer
    const renderGridItem = ({ item, index }: { item: Photo; index: number }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => setSelectedPhotoIndex(index)}
            activeOpacity={0.85}
        >
            <Image
                source={{ uri: item.image_url }}
                style={styles.gridImage}
                contentFit="cover"
                cachePolicy="memory-disk"
            />
            {item.media_type === 'video' && (
                <View style={styles.gridVideoBadge}>
                    <Play size={12} color="white" fill="white" />
                </View>
            )}
            {newPhotoIds.has(item.id) && (
                <View style={styles.gridNewDot} />
            )}
        </TouchableOpacity>
    );

    const insets = useSafeAreaInsets();

    // Generate random particles
    const particles = Array.from({ length: 15 }, (_, i) => ({
        x: Math.random() * width,
        yStart: height + Math.random() * 200,
        size: 12 + Math.random() * 8,
        duration: 8000 + Math.random() * 4000,
        icon: ['star', 'heart', 'sparkle'][i % 3],
        delay: i * 400,
    }));

    return (
        <View style={styles.container}>
            {/* Gradient Background */}
            <LinearGradient
                colors={['#FDF4FF', '#FDF2F8', '#FFF7ED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Floating Particles - NOW ACTIVE */}
            <View style={styles.particlesContainer} pointerEvents="none">
                {particles.map((particle, i) => (
                    <FloatingParticle
                        key={i}
                        x={particle.x}
                        yStart={particle.yStart}
                        size={particle.size}
                        duration={particle.duration}
                        icon={particle.icon}
                        delay={particle.delay}
                    />
                ))}
            </View>

            {/* Feed Content */}
            {isLoading ? (
                <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}>
                    <PremiumHeroHeader insetTop={insets.top} totalPhotos={totalCount} />
                    <View style={styles.loadingContainer}>
                        {[...Array(3)].map((_, i) => (
                            <View key={i} style={styles.skeletonCard}>
                                <ShimmerEffect style={styles.skeletonMedia} />
                                <View style={styles.skeletonContent}>
                                    <ShimmerEffect style={styles.skeletonLine} />
                                    <ShimmerEffect style={styles.skeletonLineShort} />
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <Animated.FlatList
                    key={viewMode}
                    data={photos}
                    keyExtractor={(item) => item.id}
                    renderItem={viewMode === 'grid' ? renderGridItem : renderItem}
                    numColumns={viewMode === 'grid' ? 3 : 1}
                    extraData={[photos.length, viewMode]}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
                    ListHeaderComponent={
                        <View>
                            <PremiumHeroHeader insetTop={insets.top} totalPhotos={totalCount} />
                            {/* A4: View Mode Toggle */}
                            <View style={styles.viewToggleRow}>
                                <TouchableOpacity
                                    style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
                                    onPress={() => { setViewMode('list'); Haptics.selectionAsync(); }}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ gap: 2.5 }}>
                                        {[0, 1, 2].map(i => (
                                            <View key={i} style={{ width: 14, height: 2, backgroundColor: viewMode === 'list' ? '#DB2777' : '#9CA3AF', borderRadius: 1 }} />
                                        ))}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
                                    onPress={() => { setViewMode('grid'); Haptics.selectionAsync(); }}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, width: 14 }}>
                                        {[0, 1, 2, 3].map(i => (
                                            <View key={i} style={{ width: 6, height: 6, backgroundColor: viewMode === 'grid' ? '#DB2777' : '#9CA3AF', borderRadius: 1 }} />
                                        ))}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    ListHeaderComponentStyle={{ marginBottom: viewMode === 'grid' ? 4 : 20 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#EC4899"
                            colors={['#EC4899', '#F43F5E']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <LinearGradient
                                colors={['#FBB6CE', '#F9A8D4']}
                                style={styles.emptyIcon}
                            >
                                <ImageOff color="white" size={48} />
                            </LinearGradient>
                            <Text style={styles.emptyTitle}>Aucun moment partagé</Text>
                            <Text style={styles.emptyText}>
                                Soyez le premier à capturer et partager un souvenir de cette journée magique ✨
                            </Text>
                        </View>
                    }
                    ItemSeparatorComponent={viewMode === 'grid' ? undefined : () => <View style={{ height: 1, backgroundColor: '#F3E8FF' }} />}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    removeClippedSubviews={false}
                    initialNumToRender={viewMode === 'grid' ? 15 : 5}
                    maxToRenderPerBatch={viewMode === 'grid' ? 15 : 5}
                    windowSize={viewMode === 'grid' ? 7 : 5}
                />
            )}

            {/* Photo Modal */}
            {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
                <PhotoModal
                    photo={photos[selectedPhotoIndex]}
                    onClose={() => setSelectedPhotoIndex(null)}
                    onLike={() => toggleLike(photos[selectedPhotoIndex])}
                    hasUserLiked={hasUserLiked(photos[selectedPhotoIndex])}
                    navigatePhoto={(dir) => {
                        if (dir === 'right' && selectedPhotoIndex < photos.length - 1)
                            setSelectedPhotoIndex(selectedPhotoIndex + 1);
                        if (dir === 'left' && selectedPhotoIndex > 0)
                            setSelectedPhotoIndex(selectedPhotoIndex - 1);
                    }}
                    canSwipeLeft={selectedPhotoIndex > 0}
                    canSwipeRight={selectedPhotoIndex < photos.length - 1}
                />
            )}

            {/* STORE_COMPLIANCE: Settings Button */}
            <TouchableOpacity
                style={[styles.settingsButton, { top: insets.top + 10 }]}
                onPress={() => setShowSettingsModal(true)}
                activeOpacity={0.8}
            >
                <BlurView intensity={30} style={styles.settingsButtonBlur}>
                    <Settings color="#6B7280" size={22} />
                </BlurView>
            </TouchableOpacity>

            {/* STORE_COMPLIANCE: Settings Modal with Logout + Delete Account */}
            <Modal
                visible={showSettingsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSettingsModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowSettingsModal(false)}>
                    <View style={styles.settingsModalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.settingsModalContent}>
                                <LinearGradient
                                    colors={['#FFFFFF', '#FDF4FF']}
                                    style={styles.settingsModalGradient}
                                >
                                    {/* Header */}
                                    <View style={styles.settingsModalHeader}>
                                        <Text style={styles.settingsModalTitle}>Paramètres</Text>
                                        <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                                            <X color="#6B7280" size={24} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* User Info */}
                                    <View style={styles.settingsUserInfo}>
                                        <View style={styles.settingsUserAvatar}>
                                            <User color="#EC4899" size={24} />
                                        </View>
                                        <Text style={styles.settingsUserName}>{currentUser || 'Invité'}</Text>
                                    </View>

                                    <View style={styles.settingsDivider} />

                                    {/* Logout Button */}
                                    <TouchableOpacity
                                        style={styles.settingsOption}
                                        onPress={handleLogout}
                                    >
                                        <LogOut color="#6B7280" size={20} />
                                        <Text style={styles.settingsOptionText}>Se déconnecter</Text>
                                    </TouchableOpacity>

                                    <View style={styles.settingsDivider} />

                                    {/* Delete Account Button */}
                                    <TouchableOpacity
                                        style={styles.settingsOption}
                                        onPress={handleDeleteAccount}
                                        disabled={isDeletingAccount}
                                    >
                                        {isDeletingAccount ? (
                                            <ActivityIndicator size="small" color="#EF4444" />
                                        ) : (
                                            <Trash2 color="#EF4444" size={20} />
                                        )}
                                        <Text style={[styles.settingsOptionText, { color: '#EF4444' }]}>
                                            Supprimer mon compte
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Warning Text */}
                                    <Text style={styles.settingsWarning}>
                                        La suppression du compte est irréversible. Vos photos resteront visibles mais seront anonymisées.
                                    </Text>
                                </LinearGradient>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    scrollContent: {
        paddingBottom: 0,
    },

    // Original Header Styles (RESTORED)
    // Removed as replaced by PremiumHeader component

    photoCounter: {
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 24,
        alignSelf: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
        overflow: 'hidden',
    },
    photoCounterGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
    },
    photoCounterText: {
        fontSize: moderateScale(22),
        fontWeight: '700',
        color: '#F43F5E',
    },
    photoCounterLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#9D174D',
        letterSpacing: 0.3,
    },

    // Loading States
    loadingContainer: {
        paddingHorizontal: 0,
        paddingTop: 10,
        gap: 1,
    },
    skeletonCard: {
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    skeletonMedia: {
        width: '100%',
        height: width,
    },
    skeletonContent: {
        padding: 16,
        gap: 12,
    },
    skeletonLine: {
        height: 16,
        borderRadius: 8,
        width: '75%',
    },
    skeletonLineShort: {
        height: 12,
        borderRadius: 6,
        width: '50%',
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#F9A8D4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    emptyTitle: {
        fontSize: moderateScale(22),
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    emptyText: {
        fontSize: moderateScale(16),
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },

    // Premium Post Card - FULL WIDTH
    premiumPostCard: {
        backgroundColor: 'white',
        width: '100%',
    },
    confettiContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        zIndex: 100,
        pointerEvents: 'none',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 12,
    },
    postHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: scale(42),
        height: scale(42),
        borderRadius: scale(21),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F9A8D4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    username: {
        fontSize: moderateScale(15),
        fontWeight: '600',
        color: '#1F2937',
        letterSpacing: 0.2,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    timeText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '400',
    },

    // Media Container - FULL WIDTH
    mediaContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    videoBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backdropFilter: 'blur(10px)',
    },
    videoBadgeText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    heartAnimation: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -50,
        marginLeft: -50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },

    // Actions
    actionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
    },
    actionsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    actionButton: {
        padding: 4,
    },
    likesSection: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    likesText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '400',
    },
    likesBold: {
        fontWeight: '700',
        color: '#1F2937',
    },
    captionSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    captionText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        fontWeight: '400',
    },
    captionUsername: {
        fontWeight: '600',
        color: '#1F2937',
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
    },
    modalContentWrapper: {
        flex: 1,
    },
    modalVignette: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    modalHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: scale(20),
        zIndex: 50,
    },
    iconButtonBlur: {
        overflow: 'hidden',
        borderRadius: 22,
    },
    iconBlur: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalBottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    bottomBarBlur: {
        overflow: 'hidden',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    bottomBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(20),
        paddingVertical: 20,
        paddingBottom: 40,
    },
    userSection: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 2,
    },
    photoTime: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    modalLikeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    modalLikeButtonActive: {
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        borderColor: '#EC4899',
    },
    modalLikeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalLikeTextActive: {
        color: '#EC4899',
    },
    optionsOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    optionsMenu: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 50,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    optionText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },

    // STORE_COMPLIANCE: Settings Button & Modal Styles
    settingsButton: {
        position: 'absolute',
        right: 16,
        zIndex: 50,
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    settingsButtonBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    settingsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    settingsModalContent: {
        width: '100%',
        maxWidth: scale(340),
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    settingsModalGradient: {
        padding: 24,
    },
    settingsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    settingsModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    settingsUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    settingsUserAvatar: {
        width: scale(48),
        height: scale(48),
        borderRadius: scale(24),
        backgroundColor: '#FDF4FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#F9A8D4',
    },
    settingsUserName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    settingsDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    settingsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
    },
    settingsOptionText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    settingsWarning: {
        marginTop: 16,
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 18,
    },

    // A4: View Mode Toggle styles
    viewToggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        marginBottom: 4,
    },
    viewToggleBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(219, 39, 119, 0.1)',
    },
    viewToggleBtnActive: {
        backgroundColor: 'rgba(251, 207, 232, 0.5)',
        borderColor: 'rgba(219, 39, 119, 0.3)',
    },

    // A4: Grid styles
    gridItem: {
        width: width / 3,
        height: width / 3,
        padding: 1,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 2,
    },
    gridVideoBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridNewDot: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F43F5E',
        borderWidth: 1,
        borderColor: 'white',
    },
});