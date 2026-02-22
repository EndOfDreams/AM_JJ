import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { scale } from '@/lib/responsive';

interface LoadingBarProps {
    height?: number;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ height = 3 }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous looping animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const barWidth = scale(300);
    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-barWidth, barWidth],
    });

    return (
        <View style={[styles.container, { height }]}>
            <Animated.View
                style={[
                    styles.barWrapper,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#A855F7', '#EC4899', '#F472B6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    barWrapper: {
        width: scale(300),
        height: '100%',
    },
    gradient: {
        flex: 1,
        borderRadius: 2,
    },
});
