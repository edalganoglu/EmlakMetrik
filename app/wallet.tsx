import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WalletScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchBalance();
        fetchTransactions();

        // Subscribe to balance changes
        const subscription = supabase
            .channel('balance_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                (payload) => {
                    setBalance(payload.new.credit_balance);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        }
    }, [user]);

    async function fetchBalance() {
        const { data } = await supabase.from('profiles').select('credit_balance').eq('id', user!.id).single();
        if (data) setBalance(data.credit_balance);
    }

    async function fetchTransactions() {
        const { data } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(5);
        if (data) setTransactions(data);
    }

    async function addTransaction(amount: number, type: 'deposit' | 'spend' | 'reward', description: string) {
        setLoading(true);
        const { error } = await supabase.from('wallet_transactions').insert({
            user_id: user!.id,
            amount,
            type,
            description
        });
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            // Trigger UI update logic implies balance updates via trigger -> subscription
            fetchTransactions();
            if (type === 'reward' || type === 'deposit') {
                Alert.alert('Başarılı', `${amount} kredi hesabınıza aktarıldı!`);
            }
        }
    }

    async function watchAd() {
        // Simulation
        setTimeout(() => {
            addTransaction(2, 'reward', 'Watched Video Ad');
        }, 1000);
    }

    async function buyCredits(amount: number, price: string) {
        // In a real app, this would integrate with IAP/Stripe
        Alert.alert(
            'Satın Alımı Onayla',
            `${amount} Kredi'yi ${price} karşılığında satın almak istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                { text: 'Satın Al', onPress: () => addTransaction(amount, 'deposit', `${amount} Kredi Paketi satın alındı`) }
            ]
        );
    }

    return (
        <View style={styles.container}>
            {/* Top App Bar */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cüzdanım</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>

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
                                <MaterialIcons name="play-circle" size={28} color={Colors.dark.primary} />
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
                                        <MaterialIcons name="diamond" size={24} color={Colors.dark.primary} />
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

                {/* İşlem Geçmişi */}
                <View style={styles.historySection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Son İşlemler</Text>
                    </View>

                    {loading ? (
                        <View style={{ padding: 16 }}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={styles.historyCard}>
                                    <Skeleton width={40} height={40} borderRadius={20} />
                                    <View style={{ flex: 1, gap: 6, marginLeft: 12 }}>
                                        <Skeleton width={120} height={14} />
                                        <Skeleton width={80} height={12} />
                                    </View>
                                    <Skeleton width={50} height={16} />
                                </View>
                            ))}
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="history" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Henüz işlem yok</Text>
                        </View>
                    ) : (
                        transactions.map((tx) => (
                            <View key={tx.id} style={styles.historyCard}>
                                <View style={styles.historyLeft}>
                                    <View style={[styles.historyIconBg, tx.amount > 0 ? { backgroundColor: 'rgba(22, 101, 52, 0.2)' } : { backgroundColor: 'rgba(153, 27, 27, 0.2)' }]}>
                                        <MaterialIcons
                                            name={tx.type === 'reward' ? 'play-circle' : tx.type === 'deposit' ? 'add-card' : 'remove-circle'}
                                            size={20}
                                            color={tx.amount > 0 ? '#4ade80' : '#f87171'}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.historyTitle}>{tx.description}</Text>
                                        <Text style={styles.historySubtitle}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.historyAmount, tx.amount > 0 ? { color: '#4ade80' } : { color: '#f87171' }]}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </Text>
                            </View>
                        ))
                    )}

                    <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>Tüm Geçmişi Gör</Text>
                        <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.dark.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    backButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        textAlign: 'center',
    },
    content: {
        backgroundColor: Colors.dark.background,
        padding: 16,
        paddingBottom: 40,
        gap: 24,
    },

    // Balance Card
    balanceCard: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 16,
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: Colors.dark.primary,
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        paddingHorizontal: 4,
    },

    // Free Earn
    freeCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
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
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    freeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    freeDesc: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
    watchButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 8,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: Colors.dark.primary,
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
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    packagesGrid: {
        gap: 16,
    },
    packageCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    packagePro: {
        borderColor: Colors.dark.primary,
        borderWidth: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: Colors.dark.primary,
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
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    packageIconBgPro: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    packageName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    creditsText: {
        color: Colors.dark.primary,
        fontWeight: '800',
        fontSize: 20,
    },
    creditsNum: {
        // Inherits
    },
    creditsUnit: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#94a3b8',
    },
    creditsTextPro: {
        color: Colors.dark.primary,
        fontWeight: '800',
        fontSize: 20,
    },
    creditsNumPro: {
        // Inherits
    },
    priceButton: {
        backgroundColor: Colors.dark.background,
        borderRadius: 8,
        height: 40,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    priceButtonText: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        fontSize: 14,
    },
    priceButtonPro: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 8,
        height: 40,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90,
        shadowColor: Colors.dark.primary,
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
        marginTop: 24,
        paddingTop: 16,
        gap: 12,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    historyAmount: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 4,
    },
    viewAllText: {
        color: '#94a3b8',
        fontWeight: '600',
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
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    historySubtitle: {
        fontSize: 12,
        color: '#94a3b8',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
});
