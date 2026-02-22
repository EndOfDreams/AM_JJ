import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles, Star } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Sparkle Icon Component (Used by FloatingParticle)
const SparkleIcon: React.FC<{ rotation: 'left' | 'right' }> = ({ rotation }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(animValue, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const rotate = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: rotation === 'left' ? ['0deg', '10deg', '0deg'] : ['0deg', '-10deg', '0deg'],
    });

    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <Sparkles color={rotation === 'left' ? '#EC4899' : '#A855F7'} size={20} />
        </Animated.View>
    );
};

// Floating Partition Component
const FloatingParticle = ({ x, yStart, size, duration, icon }: { x: number; yStart: number; size: number; duration: number; icon: 'star' | 'heart' | 'sparkle' }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const rotation = useRef(new Animated.Value(0)).current;
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const runAnimation = () => {
            anim.setValue(0);
            Animated.timing(anim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
            }).start(() => runAnimation());
        };
        runAnimation();
    }, [duration]);

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: Math.random() * 5000 + 5000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 1500, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 1500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -height],
    });

    const opacity = anim.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 1, 1, 0],
    });

    const rotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const scale = shimmer.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.3, 1],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: x,
                top: yStart,
                transform: [{ translateY }, { rotate }, { scale }],
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

// Main AnimatedBackground Component
export const AnimatedBackground = () => {
    const particles = useRef(
        [...Array(35)].map(() => ({
            x: Math.random() * width,
            yStart: Math.random() * height + height, // Start above screen
            size: Math.random() * 12 + 6,
            duration: Math.random() * 10000 + 8000, // Slower, more elegant
            icon: (Math.random() > 0.7 ? 'star' : Math.random() > 0.5 ? 'heart' : 'sparkle') as 'star' | 'heart' | 'sparkle',
        }))
    ).current;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Pink/Purple gradient matching avatars */}
            <LinearGradient
                colors={['#F9A8D4', '#D8B4FE']} // Pink-300 to Purple-300
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Glass/Frosted Overlay to soften the gradient */}
            <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(255, 255, 255, 0.8)', // High opacity for soft pastel look
            }} />
            {particles.map((p, i) => (
                <FloatingParticle key={i} {...p} />
            ))}
        </View>
    );
};
