import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        if (!user) return;
        setLoading(true);

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', user.id);

        setLoading(false);

        if (!error) {
            router.replace('/(tabs)');
        } else {
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name="verified" size={64} color={Colors.light.primary} />
                </View>

                <Text style={styles.title}>Welcome to EmlakMetrik</Text>
                <Text style={styles.subtitle}>
                    Your account has been successfully created. We've added free credits to get you started!
                </Text>

                <View style={styles.rewardCard}>
                    <View style={styles.rewardHeader}>
                        <Text style={styles.rewardLabel}>WELCOME GIFT</Text>
                    </View>
                    <View style={styles.rewardBody}>
                        <Text style={styles.rewardValue}>5</Text>
                        <Text style={styles.rewardUnit}>Credits</Text>
                    </View>
                    <Text style={styles.rewardDesc}>Use these credits to generate detailed PDF reports.</Text>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleComplete}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Setting up...' : 'Start Exploring'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.icon,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    rewardCard: {
        width: '100%',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    rewardHeader: {
        backgroundColor: Colors.light.secondary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    rewardLabel: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    rewardBody: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    rewardValue: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.light.primary,
    },
    rewardUnit: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginLeft: 8,
    },
    rewardDesc: {
        color: Colors.light.icon,
        fontSize: 14,
    },
    button: {
        width: '100%',
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
