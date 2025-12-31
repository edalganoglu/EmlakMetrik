import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        if (!user) return;
        setLoading(true);

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
        <View style={styles.mainContainer}>
            <StatusBar style="dark" />
            <LinearGradient
                colors={['#ffffff', '#f0f4ff', '#e6edff']}
                style={styles.gradientBackground}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    {/* Header / Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="verified" size={48} color="#fff" />
                        </View>
                        <Text style={styles.title}>EmlakMetrik</Text>
                        <Text style={styles.welcomeText}>Welcome to your new{'\n'}professional dashboard</Text>
                    </View>

                    {/* Reward Card */}
                    <View style={styles.cardContainer}>
                        <LinearGradient
                            colors={[Colors.light.primary, '#3b82f6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.rewardCard}
                        >
                            <View style={styles.cardHeader}>
                                <MaterialIcons name="card-giftcard" size={20} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.cardLabel}>WELCOME BONUS</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.creditAmount}>5</Text>
                                <View style={styles.creditDetail}>
                                    <Text style={styles.creditLabel}>Free Credits</Text>
                                    <Text style={styles.creditSub}>To start your analysis</Text>
                                </View>
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.cardFooterText}>Valid for all premium reports</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <Text style={styles.description}>
                        You are all set! Explore market insights, detailed reports, and investment tools instantly.
                    </Text>

                    {/* Bottom Action */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleComplete}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[Colors.light.primary, '#2563eb']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Setting up...' : 'Get Started'}
                                </Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    gradientBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        transform: [{ rotate: '-5deg' }]
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    welcomeText: {
        fontSize: 18,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 26,
    },
    cardContainer: {
        marginVertical: 40,
        width: '100%',
        shadowColor: "#2563eb",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16.00,
        elevation: 24,
    },
    rewardCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 1.5,
        marginLeft: 8,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    creditAmount: {
        fontSize: 56,
        fontWeight: '800',
        color: '#fff',
        includeFontPadding: false,
    },
    creditDetail: {
        marginLeft: 16,
        justifyContent: 'center',
    },
    creditLabel: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    creditSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    cardFooter: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    cardFooterText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500',
    },
    description: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginHorizontal: 20,
        lineHeight: 22,
        marginBottom: 20,
    },
    footer: {
        marginBottom: 20,
    },
    button: {
        width: '100%',
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        marginRight: 8,
    },
});
