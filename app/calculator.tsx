import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CalculatorScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [creditBalance, setCreditBalance] = useState<number | null>(null);

    // Inputs
    const [price, setPrice] = useState('');
    const [rent, setRent] = useState('');
    const [dues, setDues] = useState('');
    const [renovation, setRenovation] = useState('');
    const [location, setLocation] = useState('');
    const [address, setAddress] = useState('');

    // Financing
    const [useLoan, setUseLoan] = useState(false);
    const [loanRate, setLoanRate] = useState(2.49);

    // Results check
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchBalance();
        }
    }, [user]);

    const fetchBalance = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('credit_balance')
            .eq('id', user!.id)
            .single();

        if (data) {
            setCreditBalance(data.credit_balance);
        }
    };

    const calculate = () => {
        const p = parseFloat(price) || 0;
        const r = parseFloat(rent) || 0;
        const d = parseFloat(dues) || 0;
        const reno = parseFloat(renovation) || 0;
        const deedFee = p * 0.04;

        const totalCost = p + reno + deedFee;
        const monthlyExpenses = d;
        const netMonthlyIncome = r - monthlyExpenses;

        const amortization = netMonthlyIncome > 0 ? (totalCost / (netMonthlyIncome * 12)) : 0;
        const annualNetIncome = netMonthlyIncome * 12;
        const roi = totalCost > 0 ? (annualNetIncome / totalCost) * 100 : 0;

        const resultData = {
            amortization,
            roi,
            totalCost,
            netMonthlyIncome
        };

        setResults(resultData);
        saveAnalysis(resultData);
    };

    const saveAnalysis = async (resultData: any) => {
        if (!user) return;

        if (creditBalance !== null && creditBalance < 1) {
            Alert.alert('Insufficient Credits', 'You need at least 1 credit to perform an analysis.');
            return;
        }

        setLoading(true);

        const { error: txError } = await supabase.from('wallet_transactions').insert({
            user_id: user.id,
            amount: -1,
            type: 'spend',
            description: `Analysis for ${address || price}`
        });

        if (txError) {
            setLoading(false);
            Alert.alert('Error', 'Could not process credit deduction.');
            return;
        }

        const { data, error } = await supabase.from('properties').insert({
            user_id: user.id,
            title: address || `Property ${price}`,
            location: location || 'Unknown Location',
            price: parseFloat(price),
            monthly_rent: parseFloat(rent),
            status: 'completed',
            is_unlocked: true,
            params: {
                dues: parseFloat(dues),
                renovation: parseFloat(renovation),
                useLoan,
                loanRate: useLoan ? loanRate : 0,
                results: resultData
            }
        }).select();

        setLoading(false);
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setCreditBalance((prev) => (prev !== null ? prev - 1 : prev));

            if (data && data.length > 0) {
                router.replace(`/analysis/${data[0].id}`);
            } else {
                Alert.alert('Success', 'Analysis saved!');
                router.back();
            }
        }
    };

    return (
        <View style={styles.mainContainer}>
            {/* Top App Bar */}
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Analysis</Text>
                    <TouchableOpacity onPress={() => {
                        setPrice(''); setRent(''); setDues(''); setRenovation(''); setLocation(''); setAddress('');
                    }} style={styles.iconButton}>
                        <MaterialIcons name="refresh" size={24} color={Colors.dark.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}>
                {/* ... keep existing content ... */}

                {/* Credit Balance */}
                <View style={styles.creditCard}>
                    <View style={styles.creditInfo}>
                        <View style={styles.creditIcon}>
                            <MaterialIcons name="token" size={24} color={Colors.dark.primary} />
                        </View>
                        <View>
                            <Text style={styles.creditTitle}>{creditBalance !== null ? creditBalance : '...'} Credits Remaining</Text>
                            <Text style={styles.creditSubtitle}>Standard Plan</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.buyButton}>
                        <Text style={styles.buyButtonText}>Buy More</Text>
                    </TouchableOpacity>
                </View>

                {/* Property Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Property Details</Text>

                    {/* Price */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fiyat (Price)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                                placeholderTextColor="#94a3b8"
                            />
                            <View style={styles.suffix}>
                                <Text style={{ fontSize: 16, color: '#64748b' }}>₺</Text>
                            </View>
                        </View>
                    </View>

                    {/* Location & Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Şehir / Bölge (Location)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Istanbul, Kadikoy"
                                value={location}
                                onChangeText={setLocation}
                                placeholderTextColor="#94a3b8"
                            />
                            <View style={styles.suffix}>
                                <MaterialIcons name="location-on" size={20} color="#64748b" />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Adres (Address / Title)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 123 Main St"
                                value={address}
                                onChangeText={setAddress}
                                placeholderTextColor="#94a3b8"
                            />
                            <View style={styles.suffix}>
                                <MaterialIcons name="home" size={20} color="#64748b" />
                            </View>
                        </View>
                    </View>

                    {/* Rent */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Kira (Rent)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={rent}
                                onChangeText={setRent}
                                placeholderTextColor="#94a3b8"
                            />
                            <View style={styles.suffix}>
                                <Text style={{ fontSize: 16, color: '#64748b' }}>₺</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Costs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>One-time & Ongoing Costs</Text>

                    <View style={styles.row}>
                        {/* Dues */}
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Aidat (Dues)</Text>
                            <View style={styles.inputWrapperSmall}>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={dues}
                                    onChangeText={setDues}
                                    placeholderTextColor="#94a3b8"
                                />
                                <View style={styles.suffixSmall}>
                                    <MaterialIcons name="currency-lira" size={16} color="#64748b" />
                                </View>
                            </View>
                        </View>

                        {/* Reno */}
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                            <Text style={styles.label}>Tadilat (Reno)</Text>
                            <View style={styles.inputWrapperSmall}>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={renovation}
                                    onChangeText={setRenovation}
                                    placeholderTextColor="#94a3b8"
                                />
                                <View style={styles.suffixSmall}>
                                    <MaterialIcons name="construction" size={16} color="#64748b" />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Deed Fee */}
                    <View style={[styles.inputGroup, { marginTop: 12 }]}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Tapu Harcı (Deed Fee)</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Auto 4%</Text>
                            </View>
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: Colors.dark.surface, color: '#94a3b8' }]}
                                placeholder="Calculated from price"
                                editable={false}
                                value={price ? (parseFloat(price) * 0.04).toFixed(0) : ''}
                                placeholderTextColor="#94a3b8"
                            />
                            <View style={styles.suffix}>
                                <MaterialIcons name="gavel" size={20} color="#64748b" />
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Financing */}
                <View style={styles.section}>
                    <View style={styles.financingHeader}>
                        <Text style={styles.sectionTitle}>Financing</Text>
                        <View style={styles.switchRow}>
                            <Switch
                                value={useLoan}
                                onValueChange={setUseLoan}
                                trackColor={{ true: Colors.dark.primary, false: Colors.dark.border }}
                            />
                            <Text style={styles.switchLabel}>Use Loan</Text>
                        </View>
                    </View>

                    {useLoan && (
                        <View style={styles.loanCard}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Kredi Oranı (Loan Rate)</Text>
                                <Text style={styles.loanRateValue}>{loanRate.toFixed(2)}%</Text>
                            </View>

                            <View style={styles.sliderRow}>
                                <Slider
                                    style={{ flex: 1, height: 40 }}
                                    minimumValue={0}
                                    maximumValue={5}
                                    step={0.01}
                                    value={loanRate}
                                    onValueChange={setLoanRate}
                                    minimumTrackTintColor={Colors.dark.primary}
                                    maximumTrackTintColor={Colors.dark.border}
                                    thumbTintColor={Colors.dark.primary}
                                />
                                <View style={styles.rateInputWrapper}>
                                    <Text style={styles.rateInputText}>{loanRate.toFixed(2)}</Text>
                                    <View style={styles.rateSuffix}>
                                        <Text style={{ fontSize: 10, color: '#64748b' }}>%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
                <TouchableOpacity
                    style={styles.calculateButton}
                    onPress={calculate}
                    disabled={loading}
                >
                    <Text style={styles.calculateButtonText}>{loading ? 'Calculating...' : 'Calculate Analysis'}</Text>
                    <View style={styles.costBadge}>
                        <Text style={styles.costText}>1 Credit</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    safeArea: {
        backgroundColor: Colors.dark.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    iconButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#94a3b8',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    resetText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.primary,
    },
    content: {
        paddingBottom: 150,
    },

    // Credit Card
    creditCard: {
        margin: 16,
        padding: 16,
        backgroundColor: 'rgba(79, 133, 246, 0.1)', // Dark mode primary opacity
        borderWidth: 1,
        borderColor: 'rgba(79, 133, 246, 0.2)',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    creditInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    creditIcon: {
        width: 40,
        height: 40,
        backgroundColor: Colors.dark.surface,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    creditTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    creditSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94a3b8',
    },
    buyButton: {
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    buyButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },

    // Sections
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#cbd5e1',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
        backgroundColor: Colors.dark.surface,
        overflow: 'hidden',
        height: 56,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    suffix: {
        width: 48,
        height: '100%',
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: Colors.dark.border,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginHorizontal: 16,
    },

    // Small Inputs
    row: {
        flexDirection: 'row',
    },
    inputWrapperSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
        backgroundColor: Colors.dark.surface,
        overflow: 'hidden',
        height: 48,
    },
    inputSmall: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    suffixSmall: {
        width: 40,
        height: '100%',
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: Colors.dark.border,
    },

    // Badge
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        marginLeft: 4,
        paddingRight: 4,
    },
    badge: {
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.dark.primary,
    },

    // Financing
    financingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    loanCard: {
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
        padding: 16,
    },
    loanRateValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    rateInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
        height: 40,
        backgroundColor: Colors.dark.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        overflow: 'hidden',
    },
    rateInputText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    rateSuffix: {
        width: 24,
        height: '100%',
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: Colors.dark.border,
    },

    // Footer Button
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        backgroundColor: Colors.dark.background,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    calculateButton: {
        backgroundColor: Colors.dark.primary,
        height: 56,
        borderRadius: 100,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    costBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    costText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
