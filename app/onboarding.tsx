import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleClaim = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Credit is already given by handle_new_user trigger in database
            // Just mark onboarding as completed
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);

            // Update profile
            await refreshProfile();

            // Go directly to home
            router.replace('/(tabs)');
        } catch (e) {
            console.error(e);
            // Even if error, mark as completed and go home
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);
            router.replace('/(tabs)');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        if (user) {
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);
            await refreshProfile();
        }
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header - Skip button removed */}
            <View style={styles.header} />

            <View style={styles.content}>
                {/* Image Container */}
                <View style={styles.imageWrapper}>
                    {/* Main Image */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('@/assets/images/reward-credit.png')}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Floating Coin Badge */}
                    <View style={styles.coinBadge}>
                        <MaterialIcons name="attach-money" size={28} color="#FBBF24" />
                    </View>
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Hoşgeldin Hediyesi!</Text>
                    <Text style={styles.creditAmount}>+5 Kredi</Text>
                    <Text style={styles.description}>
                        İlk 5 emlak değerlemeni yapabilmen için, bizden sana küçük bir başlangıç hediyesi.
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.claimButton}
                    onPress={handleClaim}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons name="card-giftcard" size={22} color="#fff" />
                            <Text style={styles.claimButtonText}>Hediyeni Al ve Başla</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpLink} activeOpacity={0.7}>
                    <MaterialIcons name="help-outline" size={16} color="#64748b" />
                    <Text style={styles.helpText}>Krediler nasıl çalışır?</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f1623',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'flex-end',
    },
    skipButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    skipText: {
        color: '#94a3b8',
        fontSize: 15,
        fontFamily: 'Manrope_500Medium',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -48,
    },
    imageWrapper: {
        width: '100%',
        maxWidth: 320,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    imageContainer: {
        width: 260,
        height: 260,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
        elevation: 20,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    coinBadge: {
        position: 'absolute',
        top: 8,
        right: 0,
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 30,
        fontFamily: 'Manrope_700Bold',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    creditAmount: {
        fontSize: 52,
        fontFamily: 'Manrope_800ExtraBold',
        color: Colors.dark.primary,
        textAlign: 'center',
        letterSpacing: -1,
        marginVertical: 4,
    },
    description: {
        fontSize: 16,
        fontFamily: 'Manrope_500Medium',
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
        marginTop: 8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 16,
        gap: 16,
        alignItems: 'center',
    },
    claimButton: {
        width: '100%',
        height: 56,
        backgroundColor: Colors.dark.primary,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    claimButtonText: {
        fontSize: 17,
        fontFamily: 'Manrope_700Bold',
        color: '#fff',
        letterSpacing: 0.3,
    },
    helpLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    helpText: {
        fontSize: 14,
        fontFamily: 'Manrope_600SemiBold',
        color: '#64748b',
    },
});
