import { scale, moderateScale } from '@/lib/responsive';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Clock, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumHeader } from '../ui/PremiumHeader';

const { width } = Dimensions.get('window');

// Planning visible uniquement à partir du 6 juin 2026 à 5h00
const PLANNING_UNLOCK_DATE = new Date(2026, 5, 6, 5, 0, 0);

// --- Types ---
interface PlanningEvent {
    id: number;
    time: string;
    title: string;
    description: string;
    started: boolean;
    order: number;
}

// --- Components ---

// A2: Next Event Countdown Banner
const NextEventCountdown = ({ events, currentTime }: { events: PlanningEvent[], currentTime: Date }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const getVirtualMinutes = (h: number, m: number) => {
        let total = h * 60 + m;
        if (total < 8 * 60) total += 24 * 60;
        return total - 8 * 60;
    };

    const nowMinutes = getVirtualMinutes(currentTime.getHours(), currentTime.getMinutes());

    const nextEvent = events.find(event => {
        if (!event.time) return false;
        const timeStr = event.time.toLowerCase().replace('h', ':').trim();
        const [hStr, mStr] = timeStr.split(':');
        const evtH = parseInt(hStr, 10);
        const evtM = parseInt(mStr, 10);
        if (isNaN(evtH) || isNaN(evtM)) return false;
        return getVirtualMinutes(evtH, evtM) > nowMinutes;
    });

    if (!nextEvent) return null;

    const timeStr = nextEvent.time.toLowerCase().replace('h', ':').trim();
    const [hStr, mStr] = timeStr.split(':');
    const evtMinutes = getVirtualMinutes(parseInt(hStr, 10), parseInt(mStr, 10));
    const remainingMinutes = evtMinutes - nowMinutes;
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    return (
        <Animated.View style={[styles.countdownContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
                colors={['rgba(249, 168, 212, 0.15)', 'rgba(192, 132, 252, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.countdownGradient}
            >
                <Clock size={18} color="#9333EA" />
                <View style={styles.countdownTextContainer}>
                    <Text style={styles.countdownLabel}>Prochain</Text>
                    <Text style={styles.countdownEventName} numberOfLines={1}>{nextEvent.title}</Text>
                </View>
                <View style={styles.countdownTimeBox}>
                    <Text style={styles.countdownTime}>
                        {hours > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${mins} min`}
                    </Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

// Event Item Component
const EventItem = ({ event, index, currentTime }: { event: PlanningEvent, index: number, currentTime: Date }) => {
    const slideAnim = useRef(new Animated.Value(-20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseCheck = useRef(new Animated.Value(1)).current;

    // Logic: Time-based only (Virtual day starts at 8:00 AM)
    const isTimePassed = () => {
        try {
            if (!event.time) return false;

            // Normalize time string: replace 'h' with ':', trim
            const timeStr = event.time.toLowerCase().replace('h', ':').trim();
            const [hStr, mStr] = timeStr.split(':');

            const evtHours = parseInt(hStr, 10);
            const evtMinutes = parseInt(mStr, 10);

            if (isNaN(evtHours) || isNaN(evtMinutes)) return false;

            // Helper to get minutes from 8:00 AM
            const getVirtualMinutes = (h: number, m: number) => {
                let total = h * 60 + m;
                if (total < 8 * 60) total += 24 * 60; // Shift 00:00-07:59 to end of timeline
                return total - 8 * 60;
            };

            const now = new Date(); // Use fresh time
            const currentVirtual = getVirtualMinutes(now.getHours(), now.getMinutes());
            const eventVirtual = getVirtualMinutes(evtHours, evtMinutes);

            // console.log(`[Planning] ${event.title} (${event.time}) -> Now: ${currentVirtual}, Evt: ${eventVirtual} -> ${currentVirtual >= eventVirtual}`);

            return currentVirtual >= eventVirtual;
        } catch (e) {
            return false;
        }
    };

    const isStarted = isTimePassed();

    useEffect(() => {
        // Entrance Animation (Slide + Fade)
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true })
        ]).start();

        // Pulse animation for 'Started' checks
        if (isStarted) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseCheck, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseCheck, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        }
    }, [isStarted]);

    return (
        <Animated.View
            style={[
                styles.eventRow,
                {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }]
                }
            ]}
        >
            {/* Timeline Dot & Line */}
            <View style={styles.timelineLeftColumn}>
                {/* Dot or Check */}
                <Animated.View style={[
                    styles.dotCircle,
                    isStarted ? styles.dotStarted : styles.dotPending,
                    isStarted && { transform: [{ scale: pulseCheck }] }
                ]}>
                    {isStarted ? (
                        <Check color="#FFF" size={12} strokeWidth={4} />
                    ) : (
                        <View style={styles.innerDotWhite} />
                    )}
                </Animated.View>

                {/* Sparkle if started */}
                {isStarted && (
                    <View style={styles.sparkleContainer}>
                        <Sparkles color="#FACC15" size={16} fill="#FACC15" />
                    </View>
                )}
            </View>

            {/* Card */}
            <View style={[
                styles.cardContainer,
                isStarted ? styles.cardStarted : styles.cardPending
            ]}>
                <View style={styles.cardHeader}>
                    <View style={styles.timeContainer}>
                        <Clock size={16} color={isStarted ? '#16A34A' : '#F472B6'} style={{ marginRight: 6 }} />
                        <Text style={[
                            styles.timeText,
                            isStarted ? { color: '#16A34A' } : { color: '#9333EA' }
                        ]}>
                            {event.time}
                        </Text>
                    </View>

                    {isStarted && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>En cours</Text>
                        </View>
                    )}
                </View>

                <Text style={[
                    styles.eventTitle,
                    isStarted ? { color: '#166534' } : { color: '#374151' }
                ]}>
                    {event.title}
                </Text>

                {event.description ? (
                    <Text style={styles.eventDesc}>{event.description}</Text>
                ) : null}
            </View>
        </Animated.View>
    );
};

export default function PlanningScreen() {
    const [events, setEvents] = useState<PlanningEvent[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date()); // Auto-update

    // Timer to check status every minute
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 60 * 1000); // Every minute

        return () => clearInterval(intervalId);
    }, []);

    // Fetch Events
    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('PlanningEvent')
                .select('*')
                .neq('hidden', true)
                .order('order', { ascending: true });

            if (error) {
                if (__DEV__) console.error('Error fetching planning:', error);
            } else if (data) {
                setEvents(data);
            }
        } catch (err) {
            if (__DEV__) console.error('Exception fetching planning:', err);
        }
    };

    useEffect(() => {
        fetchEvents();

        const setupChannel = () => {
            return supabase
                .channel('planning_updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'PlanningEvent' },
                    (payload) => {
                        if (__DEV__) console.log('Change received!', payload);
                        fetchEvents();
                    }
                )
                .subscribe();
        };

        let channel = setupChannel();

        // Reconnect realtime when app returns from background
        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                supabase.removeChannel(channel);
                channel = setupChannel();
                fetchEvents();
            }
        });

        return () => {
            supabase.removeChannel(channel);
            appStateSub.remove();
        };
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchEvents().then(() => setRefreshing(false));
    }, []);

    const insets = useSafeAreaInsets();

    const isPlanningAvailable = currentTime >= PLANNING_UNLOCK_DATE;

    return (
        <View style={styles.container}>
            {/* Background Gradient (Purple-50 to Pink-50 imitation) */}
            <LinearGradient
                colors={['#FAF5FF', '#FFFFFF', '#FDF2F8']} // Purple-50, White, Pink-50
                style={StyleSheet.absoluteFillObject}
            />

            {!isPlanningAvailable ? (
                <>
                    <PremiumHeader
                        insetTop={insets.top}
                        title="PLANNING"
                        subtitle="Programme de la journée ✨"
                    />
                    <View style={styles.lockedContainer}>
                        <Text style={styles.lockedEmoji}>💍</Text>
                        <Text style={styles.lockedTitle}>Planning bientôt disponible</Text>
                        <Text style={styles.lockedSubtitle}>
                            Le programme sera dévoilé{'\n'}le 6 juin 2026 à 5h00
                        </Text>
                    </View>
                </>
            ) : (
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F472B6" />
                }
            >
                <PremiumHeader
                    insetTop={insets.top}
                    title="PLANNING"
                    subtitle="Programme de la journée ✨"
                />

                {/* A2: Countdown Banner */}
                {events.length > 0 && (
                    <NextEventCountdown events={events} currentTime={currentTime} />
                )}

                <View style={styles.contentWrapper}>
                    <View style={styles.timelineWrapper}>
                        {/* Vertical Line */}
                        <LinearGradient
                            colors={['#FBCFE8', '#E9D5FF', '#FBCFE8']} // Pink-200 -> Purple-200 -> Pink-200
                            style={styles.verticalLine}
                        />

                        {/* Events List */}
                        <View style={{ gap: 24 }}>
                            {events.map((event, index) => (
                                <EventItem key={event.id} event={event} index={index} currentTime={currentTime} />
                            ))}

                            {events.length === 0 && (
                                <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20 }}>
                                    Chargement du programme...
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={{ height: 80 + insets.bottom }} />
                </View>
            </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    lockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    lockedEmoji: {
        fontSize: 64,
        marginBottom: 8,
    },
    lockedTitle: {
        fontSize: moderateScale(22),
        fontWeight: '300',
        color: '#1F2937',
        letterSpacing: 1,
        textAlign: 'center',
    },
    lockedSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
    },
    scrollContent: {
        paddingBottom: 0,
    },
    contentWrapper: {
        paddingHorizontal: scale(24),
        paddingVertical: 32,
        paddingBottom: 0,
    },
    timelineWrapper: {
        position: 'relative',
    },
    verticalLine: {
        position: 'absolute',
        left: scale(21), // Center of the dot (w44/2 - 1)
        top: 16,
        bottom: 16,
        width: 2,
        borderRadius: 1,
    },
    eventRow: {
        flexDirection: 'row',
        gap: 16,
        // marginBottom: 24 (handled by gap in parent View)
    },
    timelineLeftColumn: {
        width: scale(44),
        alignItems: 'center',
        zIndex: 2,
    },
    dotCircle: {
        width: scale(44),
        height: scale(44),
        borderRadius: scale(22),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dotStarted: {
        backgroundColor: '#34D399', // Emerald-400 equivalent
    },
    dotPending: {
        backgroundColor: '#E9D5FF', // Purple-200
    },
    innerDotWhite: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    sparkleContainer: {
        position: 'absolute',
        top: -4,
        right: -4,
    },
    cardContainer: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardStarted: {
        backgroundColor: '#ECFDF5', // Green-50
        borderColor: 'rgba(167, 243, 208, 0.5)', // Green-200/50
    },
    cardPending: {
        backgroundColor: '#FFF',
        borderColor: 'rgba(252, 231, 243, 0.5)', // Pink-100/50
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: '#DCFCE7', // Green-100
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#16A34A', // Green-600
        fontSize: 12,
        fontWeight: '600',
    },
    eventTitle: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        marginBottom: 4,
    },
    eventDesc: {
        fontSize: moderateScale(14),
        color: '#6B7280', // Gray-500
        lineHeight: 20,
    },

    // A2: Countdown styles
    countdownContainer: {
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(192, 132, 252, 0.2)',
    },
    countdownGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    countdownTextContainer: {
        flex: 1,
    },
    countdownLabel: {
        fontSize: 12,
        color: '#9333EA',
        fontWeight: '500',
    },
    countdownEventName: {
        fontSize: moderateScale(15),
        color: '#374151',
        fontWeight: '600',
    },
    countdownTimeBox: {
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    countdownTime: {
        fontSize: 14,
        color: '#7C3AED',
        fontWeight: '700',
    },
});
