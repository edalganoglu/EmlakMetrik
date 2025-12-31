import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

export default function AnalysisResultScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperty();
        fetchBalance();
    }, [id]);

    const [balance, setBalance] = useState(0);

    const fetchBalance = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).single();
            if (data) setBalance(data.credit_balance);
        }
    }

    const fetchProperty = async () => {
        if (!id) return;
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (data) setProperty(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={150} height={24} />
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>

                <View style={styles.content}>
                    <View style={styles.card}>
                        <Skeleton width={120} height={24} style={{ marginBottom: 16 }} />
                        <View style={styles.overviewGrid}>
                            <View>
                                <Skeleton width={80} height={14} style={{ marginBottom: 4 }} />
                                <Skeleton width={60} height={24} />
                            </View>
                            <View>
                                <Skeleton width={80} height={14} style={{ marginBottom: 4 }} />
                                <Skeleton width={60} height={24} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Skeleton width="100%" height={200} borderRadius={16} />
                    </View>
                </View>
            </View>
        );
    }

    if (!property) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Analysis not found</Text>
            </View>
        )
    }

    // derived values
    const results = property.params?.results || {};
    // Use fallback if calculations failed or are missing
    const amortization = results.amortization || 0;
    const roi = results.roi || 0;
    const price = property.price || 0;
    const monthlyRent = property.monthly_rent || 0;
    const dues = property.params?.dues || 0;
    // Calculate simple tax (mock) or other expenses for the donut chart
    const tax = price * 0.002; // Mock annual tax
    const maintenance = monthlyRent * 0.1 * 12; // Mock maintenance annual
    const annualDues = dues * 12;
    const totalAnnualExpense = tax + annualDues + maintenance;

    // Charts Data
    // Projection: Start at Price, increase by 5% yearly (mock logic matching the assumption)
    // If we had real appreciation rate, we'd use that.
    const projectionData = [0, 2, 4, 6, 8, 10].map(y => price * Math.pow(1.05, y));


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analiz Sonuçları</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="share" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
            </View>

            {/* Sticky Action Bar */}
            <View style={styles.stickyBar}>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
                    <View style={styles.balanceValueContainer}>
                        <MaterialIcons name="monetization-on" size={18} color="#f59e0b" />
                        <Text style={styles.balanceValueText}>{balance} Kredi</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.pdfButton}>
                    <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
                    <Text style={styles.pdfButtonText}>PDF Rapor Oluştur</Text>
                    <View style={styles.costBadge}>
                        <Text style={styles.costText}>10</Text>
                        <MaterialIcons name="monetization-on" size={12} color="#fff" />
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* General Overview */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Genel Bakış</Text>
                    <View style={styles.overviewGrid}>
                        <View>
                            <Text style={styles.overviewLabel}>Amortisman</Text>
                            <Text style={styles.overviewValue}>{amortization.toFixed(0)} Yıl</Text>
                            <View style={styles.trendBadge}>
                                <MaterialIcons name="trending-down" size={14} color="#10b981" />
                                <Text style={styles.trendText}>-1.2 Yıl</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.overviewLabel}>Yıllık ROI</Text>
                            <Text style={styles.overviewValue}>%{roi.toFixed(1)}</Text>
                            <View style={styles.trendBadge}>
                                <MaterialIcons name="trending-up" size={14} color="#10b981" />
                                <Text style={styles.trendText}>+0.8%</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.expenseSummaryRow}>
                        <Text style={styles.expenseTitle}>Gider Dağılımı <Text style={styles.periodBadge}>Yıllık</Text></Text>
                        <Text style={styles.totalExpense}>₺{totalAnnualExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                    </View>

                    <View style={styles.expenseDistributionGrid}>
                        <View style={styles.expenseItem}>
                            <View style={[styles.dot, { backgroundColor: '#135bec' }]} />
                            <View>
                                <Text style={styles.expenseName}>Vergi (Est)</Text>
                                <Text style={styles.expensePercent}>{totalAnnualExpense > 0 ? ((tax / totalAnnualExpense) * 100).toFixed(0) : 0}%</Text>
                            </View>
                        </View>
                        <View style={styles.expenseItem}>
                            <View style={[styles.dot, { backgroundColor: '#60a5fa' }]} />
                            <View>
                                <Text style={styles.expenseName}>Aidat</Text>
                                <Text style={styles.expensePercent}>{totalAnnualExpense > 0 ? ((annualDues / totalAnnualExpense) * 100).toFixed(0) : 0}%</Text>
                            </View>
                        </View>
                        <View style={styles.expenseItem}>
                            <View style={[styles.dot, { backgroundColor: '#93c5fd' }]} />
                            <View>
                                <Text style={styles.expenseName}>Bakım</Text>
                                <Text style={styles.expensePercent}>{totalAnnualExpense > 0 ? ((maintenance / totalAnnualExpense) * 100).toFixed(0) : 0}%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Donut Chart Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Gider Dağılımı</Text>
                        <Text style={styles.periodBadgeInline}>Yıllık</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        <Svg width={200} height={200} viewBox="0 0 100 100">
                            {/* Background Circle */}
                            <Circle cx="50" cy="50" r="40" stroke={Colors.dark.border} strokeWidth="12" fill="transparent" />
                            {/* Segments (Mocked using strokeDasharray) */}
                            {/* Blue Segment */}
                            <Circle
                                cx="50" cy="50" r="40"
                                stroke="#135bec" strokeWidth="12" fill="transparent"
                                strokeDasharray="75 251" strokeLinecap="round" origin="50, 50" rotation="-90"
                            />
                            {/* Light Blue Segment */}
                            <Circle
                                cx="50" cy="50" r="40"
                                stroke="#60a5fa" strokeWidth="12" fill="transparent"
                                strokeDasharray="100 251" strokeLinecap="round" origin="50, 50" rotation="15" // Approx rotation
                            />
                            {/* Lighter Blue Segment */}
                            <Circle
                                cx="50" cy="50" r="40"
                                stroke="#93c5fd" strokeWidth="12" fill="transparent"
                                strokeDasharray="50 251" strokeLinecap="round" origin="50, 50" rotation="160" // Approx rotation
                            />
                        </Svg>
                        <View style={styles.donutLabel}>
                            <Text style={styles.donutLabelTitle}>Toplam</Text>
                            <Text style={styles.donutLabelValue}>{(totalAnnualExpense / 1000).toFixed(1)}k</Text>
                        </View>
                    </View>
                </View>

                {/* Line Chart Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderCol}>
                        <Text style={styles.cardTitle}>10 Yıllık Değer Projeksiyonu</Text>
                        <Text style={styles.cardSubtitle}>Tahmini değer artışı</Text>
                    </View>

                    <LineChart
                        data={{
                            labels: ["2024", "2026", "2028", "2030", "2032", "2034"],
                            datasets: [{ data: projectionData }]
                        }}
                        width={screenWidth - 64} // Card padding
                        height={200}
                        withDots={false}
                        withInnerLines={true}
                        withOuterLines={false}
                        withVerticalLines={false}
                        withHorizontalLabels={false}
                        chartConfig={{
                            backgroundColor: Colors.dark.surface,
                            backgroundGradientFrom: Colors.dark.surface,
                            backgroundGradientTo: Colors.dark.surface,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(79, 133, 246, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForBackgroundLines: {
                                strokeDasharray: "", // solid lines
                                stroke: Colors.dark.border
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                    {/* Mock Tooltip overlay to match design "8.2M" tag */}
                    <View style={styles.chartTooltip}>
                        <Text style={styles.chartTooltipText}>
                            ₺{(projectionData[projectionData.length - 1] / 1000000).toFixed(2)}M
                        </Text>
                        <View style={styles.chartTooltipArrow} />
                    </View>
                </View>

                {/* Bottom Spacer */}
                <View style={{ height: 40 }} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Safe area approx
        paddingBottom: 16,
        backgroundColor: Colors.dark.background,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },

    // Sticky Bar
    stickyBar: {
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        zIndex: 10,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    balanceLabel: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    balanceValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    balanceValueText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    pdfButton: {
        backgroundColor: Colors.dark.primary,
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    pdfButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 2,
    },
    costText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    // Content
    content: {
        padding: 16,
        gap: 20,
    },
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    overviewGrid: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16,
    },
    overviewLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 4,
    },
    overviewValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 2,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginVertical: 16,
    },
    expenseSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#cbd5e1',
    },
    periodBadge: {
        fontSize: 12,
        fontWeight: '500',
        color: '#cbd5e1',
        backgroundColor: Colors.dark.background,
    },
    totalExpense: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    expenseDistributionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    expenseItem: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        width: '45%',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    expenseName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#cbd5e1',
    },
    expensePercent: {
        fontSize: 12,
        color: '#94a3b8',
    },

    // Donut
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    periodBadgeInline: {
        fontSize: 12,
        fontWeight: '500',
        color: '#cbd5e1',
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    donutLabel: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutLabelTitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    donutLabelValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },

    // Line Chart
    cardHeaderCol: {
        marginBottom: 16,
    },
    chartTooltip: {
        position: 'absolute',
        top: 60,
        right: 10,
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    chartTooltipText: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    chartTooltipArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.dark.background,
        position: 'absolute',
        bottom: -5,
    },
});
