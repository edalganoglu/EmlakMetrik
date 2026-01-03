import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    fullScreen?: boolean;
}

const sizeMap = {
    small: { container: 40, icon: 20, ring: 36 },
    medium: { container: 64, icon: 28, ring: 56 },
    large: { container: 96, icon: 40, ring: 88 },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    message,
    fullScreen = false,
}) => {
    const rotation = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0.8)).current;
    const ringScale = useRef(new Animated.Value(0.8)).current;
    const ringOpacity = useRef(new Animated.Value(0.6)).current;

    const dimensions = sizeMap[size];

    useEffect(() => {
        // Rotation animation
        const rotateAnim = Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // Pulse animation for icon
        const pulseAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.8,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // Ring expansion animation
        const ringAnim = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(ringScale, {
                        toValue: 1.3,
                        duration: 1200,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOpacity, {
                        toValue: 0,
                        duration: 1200,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(ringScale, {
                        toValue: 0.8,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOpacity, {
                        toValue: 0.6,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        rotateAnim.start();
        pulseAnim.start();
        ringAnim.start();

        return () => {
            rotateAnim.stop();
            pulseAnim.stop();
            ringAnim.stop();
        };
    }, [rotation, pulse, ringScale, ringOpacity]);

    const rotateInterpolate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const content = (
        <View style={styles.spinnerWrapper}>
            {/* Expanding ring */}
            <Animated.View
                style={[
                    styles.ring,
                    {
                        width: dimensions.ring,
                        height: dimensions.ring,
                        borderRadius: dimensions.ring / 2,
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                    },
                ]}
            />

            {/* Rotating outer circle */}
            <Animated.View
                style={[
                    styles.outerCircle,
                    {
                        width: dimensions.container,
                        height: dimensions.container,
                        borderRadius: dimensions.container / 2,
                        transform: [{ rotate: rotateInterpolate }],
                    },
                ]}
            />

            {/* Center icon with pulse */}
            <Animated.View
                style={[
                    styles.iconContainer,
                    {
                        width: dimensions.container - 8,
                        height: dimensions.container - 8,
                        borderRadius: (dimensions.container - 8) / 2,
                        transform: [{ scale: pulse }],
                    },
                ]}
            >
                <MaterialIcons
                    name="home"
                    size={dimensions.icon}
                    color={Colors.dark.primary}
                />
            </Animated.View>

            {/* Message */}
            {message && size !== 'small' && (
                <Text style={styles.message}>{message}</Text>
            )}
        </View>
    );

    if (fullScreen) {
        return <View style={styles.fullScreenContainer}>{content}</View>;
    }

    return content;
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    spinnerWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    ring: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: Colors.dark.primary,
    },
    outerCircle: {
        position: 'absolute',
        borderWidth: 3,
        borderColor: 'transparent',
        borderTopColor: Colors.dark.primary,
        borderRightColor: 'rgba(79, 133, 246, 0.3)',
    },
    iconContainer: {
        backgroundColor: 'rgba(79, 133, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 16,
        fontSize: 14,
        fontFamily: 'Manrope_500Medium',
        color: '#94a3b8',
        textAlign: 'center',
    },
});
