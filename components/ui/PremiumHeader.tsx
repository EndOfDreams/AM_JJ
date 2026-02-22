import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { moderateScale } from '@/lib/responsive';

// --- Premium Header Sub-Components ---

const FloatingDecor = ({ index }: { index: number }) => {
    const yAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(yAnim, { toValue: -10, duration: (3000 + index * 500) / 2, useNativeDriver: true }),
                Animated.timing(yAnim, { toValue: 0, duration: (3000 + index * 500) / 2, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const left = `${20 + index * 25}%` as const;
    const top = `${10 + (index % 2) * 50}%` as const;

    return (
        <Animated.View style={{
            position: 'absolute',
            left, top,
            transform: [{ translateY: yAnim }],
            opacity: 0.3
        } as any}>
            {index % 2 === 0 ? (
                <Heart size={8} color="#FDA4AF" fill="#FDA4AF" />
            ) : (
                <Sparkles size={8} color="#D8B4FE" />
            )}
        </Animated.View>
    );
};

const HeaderLogo = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
        ).start();
    }, []);

    return (
        <View style={{ alignItems: 'center', marginBottom: 8, marginTop: 16 }}>
            {/* Glow behind */}
            <Animated.View style={{
                position: 'absolute',
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: '#EC4899',
                opacity: 0.2,
                transform: [{ scale: pulseAnim }]
            } as any} />

            <Image
                source={require('../../assets/AM_JJ.png')}
                style={{
                    width: 48, height: 48, borderRadius: 24,
                    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)'
                }}
                resizeMode="cover"
            />
        </View>
    );
};



// --- Main Component ---

interface PremiumHeaderProps {
    insetTop: number;
    title: string;
    subtitle: string;
}

export const PremiumHeader = ({ insetTop, title, subtitle }: PremiumHeaderProps) => {
    return (
        <View style={{ paddingTop: insetTop, zIndex: 50 }}>
            {/* Light Green-Purple Gradient Background */}
            <LinearGradient
                colors={['rgba(220, 252, 231, 0.95)', 'rgba(243, 232, 255, 0.95)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <BlurView intensity={20} tint="light" style={{ width: '100%', overflow: 'hidden', paddingBottom: 12 }}>

                {/* Top Accent Line */}
                <LinearGradient
                    colors={['transparent', 'rgba(253, 164, 175, 0.6)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 2, width: '100%', position: 'absolute', top: 0 }}
                />

                {/* Floating Decor */}
                <View style={{ ...StyleSheet.absoluteFillObject, overflow: 'hidden' }} pointerEvents="none">
                    {[...Array(4)].map((_, i) => <FloatingDecor key={i} index={i} />)}
                </View>

                {/* Main Content Column */}
                <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 24 }}>

                    <HeaderLogo />

                    <Text style={styles.title}>
                        {title}
                    </Text>

                    {/* Divider with Heart */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <LinearGradient colors={['transparent', '#FDA4AF', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 32, height: 1 }} />
                        <Heart size={10} color="#FB7185" fill="#FB7185" />
                        <LinearGradient colors={['transparent', '#C084FC', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 32, height: 1 }} />
                    </View>

                    <Text style={styles.subtitle}>
                        {subtitle}
                    </Text>



                </View>

            </BlurView>

            {/* Bottom Border */}
            <View style={{ height: 1, backgroundColor: '#F3F4F6', width: '100%' }} />
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: moderateScale(18),
        fontWeight: '300',
        letterSpacing: 4,
        color: '#E11D48',
        marginBottom: 6,
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: moderateScale(11),
        color: '#6B7280',
        fontWeight: '300',
        letterSpacing: 0.5
    }
});
