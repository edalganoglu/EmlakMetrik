import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (!user) return;
        fetchBalance();
    }, [user]);

    async function fetchBalance() {
        const { data } = await supabase.from('profiles').select('credit_balance').eq('id', user!.id).single();
        if (data) setBalance(data.credit_balance);
    }

    async function watchAd() {
        Alert.alert('Video İzle', 'Reklam izlendi! (Simülasyon: +2 Kredi)');
        // Mock backend update
        setBalance(prev => prev + 2);
    }

    async function buyCredits(amount: number, price: string) {
        Alert.alert('Satın Al', `${price} karşılığında ${amount} kredi satın alma işlemi başlatılıyor...`);
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Top App Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#111318" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cüzdanım</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    {/* Decorative blurred shapes */}
                    <View style={styles.balanceDecor1} />
                    <View style={styles.balanceDecor2} />

                    <View style={styles.balanceContent}>
                        <Text style={styles.balanceLabel}>MEVCUT BAKİYE</Text>
                        <View style={styles.balanceRow}>
                            <MaterialIcons name="account-balance-wallet" size={36} color="#fff" />
                            <Text style={styles.balanceValue}>{balance}</Text>
                        </View>
                        <Text style={styles.balanceUnit}>Kredi</Text>
                    </View>
                </View>

                {/* Ücretsiz Kazan Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ücretsiz Kazan</Text>
                    <View style={styles.freeCard}>
                        <View style={styles.freeHeader}>
                            <View style={styles.playIconWrapper}>
                                <MaterialIcons name="play-circle" size={28} color={Colors.light.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.freeTitle}>Video İzle</Text>
                                <Text style={styles.freeDesc}>Kısa bir reklam izleyerek hesabına anında +2 kredi yükle.</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.watchButton} onPress={watchAd}>
                            <MaterialIcons name="smart-display" size={20} color="#fff" />
                            <Text style={styles.watchButtonText}>İzle (+2 Kredi)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Paket Satın Al Section */}
                <View style={styles.section}>
                    <View style={styles.packagesHeader}>
                        <Text style={styles.sectionTitle}>Paket Satın Al</Text>
                        <TouchableOpacity>
                            <Text style={styles.restoreText}>Geri Yükle</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.packagesGrid}>
                        {/* Başlangıç */}
                        <View style={styles.packageCard}>
                            <View style={styles.packageCardInner}>
                                <View style={styles.packageLeft}>
                                    <View style={styles.packageIconBg}>
                                        <MaterialIcons name="savings" size={24} color="#64748b" />
                                    </View>
                                    <View>
                                        <Text style={styles.packageName}>Başlangıç</Text>
                                        <Text style={styles.creditsText}>
                                            <Text style={styles.creditsNum}>20</Text> <Text style={styles.creditsUnit}>Kredi</Text>
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.priceButton} onPress={() => buyCredits(20, '₺29.99')}>
                                    <Text style={styles.priceButtonText}>₺29.99</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Pro (Popular) */}
                        <View style={[styles.packageCard, styles.packagePro]}>
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularText}>POPÜLER</Text>
                            </View>
                            <View style={[styles.packageCardInner, { paddingTop: 8 }]}>
                                <View style={styles.packageLeft}>
                                    <View style={styles.packageIconBgPro}>
                                        <MaterialIcons name="diamond" size={24} color={Colors.light.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.packageName}>Pro</Text>
                                        <Text style={styles.creditsTextPro}>
                                            <Text style={styles.creditsNumPro}>100</Text> <Text style={styles.creditsUnit}>Kredi</Text>
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.priceButtonPro} onPress={() => buyCredits(100, '₺129.99')}>
                                    <Text style={styles.priceButtonTextPro}>₺129.99</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Ofis */}
                        <View style={styles.packageCard}>
                            <View style={styles.packageCardInner}>
                                <View style={styles.packageLeft}>
                                    <View style={styles.packageIconBg}>
                                        <MaterialIcons name="apartment" size={24} color="#64748b" />
                                    </View>
                                    <View>
                                        <Text style={styles.packageName}>Ofis</Text>
                                        <Text style={styles.creditsText}>
                                            <Text style={styles.creditsNum}>500</Text> <Text style={styles.creditsUnit}>Kredi</Text>
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.priceButton} onPress={() => buyCredits(500, '₺499.99')}>
                                    <Text style={styles.priceButtonText}>₺499.99</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Transaction History Link */}
                <View style={styles.historySection}>
                    <TouchableOpacity style={styles.historyCard}>
                        <View style={styles.historyLeft}>
                            <View style={styles.historyIconBg}>
                                <MaterialIcons name="history" size={20} color="#64748b" />
                            </View>
                            <View>
                                <Text style={styles.historyTitle}>İşlem Geçmişi</Text>
                                <Text style={styles.historySubtitle}>Son harcamalarınızı görüntüleyin</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Use white background as base to match cleaner look if desired, or light gray.
        // HTML body bg is bg-background-light (#f6f6f8). Let's stick to that for outer, but SafeArea is typically white.
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#dbdfe6',
    },
    backButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        // hover effect not applicable in RN directly same way
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111318',
        textAlign: 'center',
    },
    content: {
        backgroundColor: '#f6f6f8',
        padding: 16,
        paddingBottom: 40,
        gap: 24,
    },

    // Balance Card
    balanceCard: {
        backgroundColor: Colors.light.primary,
        borderRadius: 16,
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    balanceDecor1: {
        position: 'absolute',
        top: -16,
        right: -16,
        width: 128,
        height: 128,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 64,
    },
    balanceDecor2: {
        position: 'absolute',
        bottom: -16,
        left: -16,
        width: 96,
        height: 96,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 48,
    },
    balanceContent: {
        alignItems: 'center',
        zIndex: 10,
    },
    balanceLabel: {
        color: '#dbeafe', // blue-100
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.9,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 48,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },
    balanceUnit: {
        color: '#dbeafe',
        fontSize: 16,
        fontWeight: '500',
    },

    // Sections
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111318',
        paddingHorizontal: 4,
    },

    // Free Earn
    freeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#dbdfe6',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    freeHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    playIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(19, 91, 236, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    freeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111318',
        marginBottom: 4,
    },
    freeDesc: {
        fontSize: 14,
        color: '#616f89',
        lineHeight: 20,
    },
    watchButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: 8,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    watchButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Store / Packages
    packagesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    restoreText: {
        color: Colors.light.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    packagesGrid: {
        gap: 16,
    },
    packageCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dbdfe6',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    packagePro: {
        borderColor: Colors.light.primary,
        borderWidth: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: Colors.light.primary,
        borderBottomLeftRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 5,
    },
    popularText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    packageCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    packageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    packageIconBg: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    packageIconBgPro: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(19, 91, 236, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    packageName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111318',
    },
    creditsText: {
        color: Colors.light.primary,
        fontWeight: '800',
        fontSize: 20,
    },
    creditsNum: {
        // Inherits
    },
    creditsUnit: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#616f89',
    },
    creditsTextPro: {
        color: Colors.light.primary,
        fontWeight: '800',
        fontSize: 20,
    },
    creditsNumPro: {
        // Inherits
    },
    priceButton: {
        backgroundColor: '#f0f2f4',
        borderRadius: 8,
        height: 40,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90,
    },
    priceButtonText: {
        color: '#111318',
        fontWeight: 'bold',
        fontSize: 14,
    },
    priceButtonPro: {
        backgroundColor: Colors.light.primary,
        borderRadius: 8,
        height: 40,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    priceButtonTextPro: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // History
    historySection: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#dbdfe6',
        paddingTop: 24,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111318',
    },
    historySubtitle: {
        fontSize: 12,
        color: '#616f89',
    },
});
