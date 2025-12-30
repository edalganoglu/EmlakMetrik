import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    }, [id]);

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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
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
    // Using mock logic if params are missing to fill the UI
    const results = property.params?.results || {};
    const amortization = results.amortization || 18;
    const roi = results.roi || 5.4;
    const price = property.price || 0;

    // Charts Data
    // Projection: Start at Price, increase by 5% yearly (mock)
    const projectionData = [0, 2, 4, 6, 8, 10].map(y => price * Math.pow(1.15, y)); // 15% increase every 2 years for drama

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#111318" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analiz Sonuçları</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="share" size={24} color="#111318" />
                </TouchableOpacity>
            </View>

            {/* Sticky Action Bar */}
            <View style={styles.stickyBar}>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
                    <View style={styles.balanceValueContainer}>
                        <MaterialIcons name="monetization-on" size={18} color="#f59e0b" />
                        <Text style={styles.balanceValueText}>125 Kredi</Text>
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
                        <Text style={styles.totalExpense}>₺24.5k</Text>
                    </View>

                    <View style={styles.expenseDistributionGrid}>
                        <View style={styles.expenseItem}>
                            <View style={[styles.dot, { backgroundColor: '#135bec' }]} />
                            <View>
                                <Text style={styles.expenseName}>Vergi</Text>
                                <Text style={styles.expensePercent}>%30</Text>
                            </View>
                        </View>
                        <View style={styles.expenseItem}>
                            <View style={[styles.dot, { backgroundColor: '#60a5fa' }]} />
                            <View>
                                <Text style={styles.expenseName}>Aidat</Text>
                                <Text style={styles.expensePercent}>%45</Text>
                            </View>
                        </View>
                        <View style={styles.expenseItem}>
                            <View style={[styles.dot, { backgroundColor: '#93c5fd' }]} />
                            <View>
                                <Text style={styles.expenseName}>Bakım</Text>
                                <Text style={styles.expensePercent}>%25</Text>
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
                            <Circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
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
                            <Text style={styles.donutLabelValue}>₺24.5k</Text>
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
                            backgroundColor: '#fff',
                            backgroundGradientFrom: '#fff',
                            backgroundGradientTo: '#fff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(19, 91, 236, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForBackgroundLines: {
                                strokeDasharray: "", // solid lines
                                stroke: "#f1f5f9"
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
                            ₺{(projectionData[projectionData.length - 1] / 1000000).toFixed(1)}M
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
        backgroundColor: '#f6f6f8',
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
        backgroundColor: '#fff',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f6f6f8', // Hover effect mock
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111318',
    },

    // Sticky Bar
    stickyBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
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
        color: '#64748b',
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
        color: '#111318',
    },
    pdfButton: {
        backgroundColor: Colors.light.primary,
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: Colors.light.primary,
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111318',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    overviewGrid: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16,
    },
    overviewLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    overviewValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111318',
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
        backgroundColor: '#f1f5f9',
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
        color: '#334155',
    },
    periodBadge: {
        fontSize: 12,
        fontWeight: '500',
        color: '#475569',
        backgroundColor: '#f1f5f9',
    },
    totalExpense: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111318',
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
        color: '#334155',
    },
    expensePercent: {
        fontSize: 12,
        color: '#64748b',
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
        color: '#475569',
        backgroundColor: '#f1f5f9',
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
        color: '#64748b',
        fontWeight: '500',
    },
    donutLabelValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111318',
    },

    // Line Chart
    cardHeaderCol: {
        marginBottom: 16,
    },
    chartTooltip: {
        position: 'absolute',
        top: 60,
        right: 10,
        backgroundColor: '#111318',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignItems: 'center',
    },
    chartTooltipText: {
        color: '#fff',
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
        borderTopColor: '#111318',
        position: 'absolute',
        bottom: -5,
    },
});
