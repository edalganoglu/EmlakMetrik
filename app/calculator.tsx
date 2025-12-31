import { LocationOption, LocationPicker } from '@/components/LocationPicker';
import { FALLBACK_DEFAULTS } from '@/constants/defaults';
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

    // Location picker state
    const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);

    // Inputs
    const [price, setPrice] = useState('');
    const [rent, setRent] = useState('');
    const [dues, setDues] = useState('');
    const [renovation, setRenovation] = useState('');
    const [address, setAddress] = useState('');
    const [sqm, setSqm] = useState('');

    // Financing - will be updated from regional defaults
    const [useLoan, setUseLoan] = useState(false);
    const [loanRate, setLoanRate] = useState(FALLBACK_DEFAULTS.default_loan_rate);
    const [loanTerm, setLoanTerm] = useState(FALLBACK_DEFAULTS.default_loan_term);
    const [downPaymentPercent, setDownPaymentPercent] = useState(FALLBACK_DEFAULTS.default_down_payment);

    // Projections - will be updated from regional defaults
    const [appreciationRate, setAppreciationRate] = useState(FALLBACK_DEFAULTS.appreciation_rate);

    // Track if user has manually changed values (don't override if they did)
    const [userModifiedFields, setUserModifiedFields] = useState<Set<string>>(new Set());

    // Results check
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchBalance();
        }
    }, [user]);

    // Handle location selection from LocationPicker
    const handleLocationSelect = (location: LocationOption) => {
        setSelectedLocation(location);

        // Apply regional defaults from selected location (only for fields user hasn't modified)
        if (location.avg_dues && !userModifiedFields.has('dues') && !dues) {
            setDues(location.avg_dues.toString());
        }
        if (location.appreciation_rate && !userModifiedFields.has('appreciation')) {
            setAppreciationRate(location.appreciation_rate);
        }
    };

    // Track when user modifies a field
    const markFieldAsModified = (fieldName: string) => {
        setUserModifiedFields(prev => new Set(prev).add(fieldName));
    };

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
        const propertySquareMeters = parseFloat(sqm) || 0;
        const rate = loanRate / 100; // Aylık faiz oranını decimal'e çevir

        // 1. Kredi Hesaplaması
        let monthlyLoanPayment = 0;
        let downPayment = p; // Peşinat (Kredi yoksa tamamı)
        let loanAmount = 0;

        if (useLoan && rate > 0) {
            const downPaymentRatio = downPaymentPercent / 100;
            loanAmount = p * (1 - downPaymentRatio); // Kredi tutarı
            downPayment = p * downPaymentRatio; // Cepten çıkan peşinat

            // Kredi Taksit Formülü (PMT) - Aylık Ödeme
            // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
            const n = loanTerm; // Vade (ay)
            const i = rate; // Aylık faiz

            if (n > 0) {
                monthlyLoanPayment = loanAmount * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
            }
        }

        // 2. Maliyetler
        const deedFee = p * 0.04; // Tapu harcı
        const totalInitialCost = downPayment + reno + deedFee; // ROI buna göre hesaplanır!
        const totalPropertyCost = p + reno + deedFee; // Toplam maliyet (kredisiz bakış)

        // 3. Nakit Akışı
        const monthlyExpenses = d + monthlyLoanPayment; // Aidat + Kredi Taksiti
        const netMonthlyIncome = r - monthlyExpenses;

        // 4. ROI ve Amortisman
        const annualNetIncome = netMonthlyIncome * 12;

        // Cash on Cash Return (Kredi varsa - cepten çıkan paraya göre getiri)
        const cashOnCashReturn = totalInitialCost > 0 ? (annualNetIncome / totalInitialCost) * 100 : 0;

        // Brüt ROI (Kredisiz bakış - tüm yatırıma göre)
        const grossRoi = totalPropertyCost > 0 ? ((r * 12) / totalPropertyCost) * 100 : 0;

        // Amortisman (Yıl) = Toplam Ev Fiyatı / (Brüt Kira - Aidat) - Kredisiz bakış açısı
        const amortization = (r - d) > 0 ? totalPropertyCost / ((r - d) * 12) : 0;

        // 5. Piyasa Karşılaştırma (Bölgesel ortalamadan otomatik)
        let marketComparison = null;

        // Seçilen konumun ortalama m² fiyatını kullan
        const marketAvgPricePerSqm = selectedLocation?.avg_price_per_sqm || 0;

        if (marketAvgPricePerSqm > 0 && propertySquareMeters > 0) {
            const propertyPricePerSqm = p / propertySquareMeters;
            const difference = propertyPricePerSqm - marketAvgPricePerSqm;
            const differencePercent = (difference / marketAvgPricePerSqm) * 100;
            marketComparison = {
                avgPricePerSqm: marketAvgPricePerSqm,
                propertyPricePerSqm,
                difference,
                differencePercent,
                isBelowMarket: difference < 0,
                source: selectedLocation?.level || 'regional' // Veri kaynağı (mahalle/ilçe/il)
            };
        }

        const resultData = {
            // Temel Değerler
            amortization,
            roi: useLoan ? cashOnCashReturn : grossRoi, // Duruma göre doğru ROI
            cashOnCashReturn,
            grossRoi,
            totalInitialCost, // Cepten çıkan toplam
            totalPropertyCost, // Toplam yatırım değeri
            netMonthlyIncome,
            monthlyExpenses,

            // Kredi Bilgileri
            useLoan,
            loanAmount,
            downPayment,
            monthlyLoanPayment,
            loanTerm,
            loanRate,

            // Projeksiyon
            appreciationRate,

            // Piyasa Analizi (Bölgesel veriden)
            marketComparison,

            // Ek Bilgiler
            propertySquareMeters,
            pricePerSqm: propertySquareMeters > 0 ? p / propertySquareMeters : 0
        };

        setResults(resultData);
        saveAnalysis(resultData);
    };

    const saveAnalysis = async (resultData: any) => {
        if (!user) return;

        if (creditBalance !== null && creditBalance < 2) {
            Alert.alert('Yetersiz Kredi', 'Analiz yapmak için en az 2 krediniz olmalı.');
            return;
        }

        setLoading(true);

        const params = {
            dues: parseFloat(dues),
            renovation: parseFloat(renovation),
            sqm: parseFloat(sqm) || 0,
            useLoan,
            loanRate: useLoan ? loanRate : 0,
            loanTerm: useLoan ? loanTerm : 0,
            downPaymentPercent: useLoan ? downPaymentPercent : 100,
            appreciationRate,
            results: resultData
        };

        // Try secure RPC call first (server-side credit deduction)
        const { data: rpcData, error: rpcError } = await supabase.rpc('spend_credit_and_save_analysis', {
            p_user_id: user.id,
            p_title: address || `Property ${price}`,
            p_location: selectedLocation?.display_name || 'Unknown Location',
            p_price: parseFloat(price),
            p_monthly_rent: parseFloat(rent),
            p_params: params
        });

        // If RPC function exists and worked
        if (!rpcError && rpcData) {
            setLoading(false);

            if (rpcData.success) {
                setCreditBalance(rpcData.new_balance);
                router.replace(`/analysis/${rpcData.property_id}`);
            } else {
                Alert.alert('Hata', rpcData.error || 'Bir sorun oluştu.');
            }
            return;
        }

        // Fallback to legacy method if RPC not available
        console.log('RPC not available, using legacy method:', rpcError?.message);

        const { error: txError } = await supabase.from('wallet_transactions').insert({
            user_id: user.id,
            amount: -2,
            type: 'spend',
            description: `Analysis for ${address || price}`
        });

        if (txError) {
            setLoading(false);
            Alert.alert('Hata', 'Kredi düşürülürken bir sorun oluştu.');
            return;
        }

        const { data, error } = await supabase.from('properties').insert({
            user_id: user.id,
            title: address || `Property ${price}`,
            location: selectedLocation?.display_name || 'Unknown Location',
            price: parseFloat(price),
            monthly_rent: parseFloat(rent),
            status: 'completed',
            is_unlocked: true,
            params
        }).select();

        setLoading(false);
        if (error) {
            Alert.alert('Hata', error.message);
        } else {
            setCreditBalance((prev) => (prev !== null ? prev - 2 : prev));

            if (data && data.length > 0) {
                router.replace(`/analysis/${data[0].id}`);
            } else {
                Alert.alert('Başarılı', 'Analiz kaydedildi!');
                router.back();
            }
        }
    };

    const resetForm = () => {
        setPrice('');
        setRent('');
        setDues('');
        setRenovation('');
        setSelectedLocation(null);
        setAddress('');
        setSqm('');
        setUseLoan(false);
        setLoanRate(FALLBACK_DEFAULTS.default_loan_rate);
        setLoanTerm(FALLBACK_DEFAULTS.default_loan_term);
        setDownPaymentPercent(FALLBACK_DEFAULTS.default_down_payment);
        setAppreciationRate(FALLBACK_DEFAULTS.appreciation_rate);
        setUserModifiedFields(new Set());
        setResults(null);
    };

    // Anlık hesaplama preview
    const previewCalculation = () => {
        const p = parseFloat(price) || 0;
        const r = parseFloat(rent) || 0;
        const d = parseFloat(dues) || 0;
        const rate = loanRate / 100;

        if (useLoan && rate > 0 && p > 0) {
            const downPaymentRatio = downPaymentPercent / 100;
            const loanAmount = p * (1 - downPaymentRatio);
            const n = loanTerm;
            const i = rate;
            if (n > 0) {
                const monthlyPayment = loanAmount * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
                return {
                    downPayment: p * downPaymentRatio,
                    loanAmount,
                    monthlyPayment,
                    totalExpenses: d + monthlyPayment
                };
            }
        }
        return null;
    };

    const loanPreview = previewCalculation();

    return (
        <View style={styles.mainContainer}>
            {/* Top App Bar */}
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yeni Analiz</Text>
                    <TouchableOpacity onPress={resetForm} style={styles.iconButton}>
                        <MaterialIcons name="refresh" size={24} color={Colors.dark.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}>

                {/* Credit Balance */}
                <View style={styles.creditCard}>
                    <View style={styles.creditInfo}>
                        <View style={styles.creditIcon}>
                            <MaterialIcons name="token" size={24} color={Colors.dark.primary} />
                        </View>
                        <View>
                            <Text style={styles.creditTitle}>{creditBalance !== null ? creditBalance : '...'} Kredi Kaldı</Text>
                            <Text style={styles.creditSubtitle}>Standart Plan</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.buyButton}>
                        <Text style={styles.buyButtonText}>Kredi Al</Text>
                    </TouchableOpacity>
                </View>

                {/* Property Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mülk Bilgileri</Text>

                    {/* Price */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Satış Fiyatı</Text>
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

                    {/* Square Meters */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Alan (m²)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={sqm}
                                onChangeText={setSqm}
                                placeholderTextColor="#94a3b8"
                            />
                            <View style={styles.suffix}>
                                <Text style={{ fontSize: 14, color: '#64748b' }}>m²</Text>
                            </View>
                        </View>
                        {sqm && price ? (
                            <Text style={styles.helperText}>
                                m² Fiyatı: ₺{(parseFloat(price) / parseFloat(sqm)).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </Text>
                        ) : null}
                    </View>


                    {/* Location Picker */}
                    <LocationPicker
                        value={selectedLocation}
                        onSelect={handleLocationSelect}
                        placeholder="Konum seçmek için tıklayın..."
                        label="Şehir / Bölge"
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Adres / Başlık</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="örn: Fenerbahçe Mah. Bağdat Cad."
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
                        <Text style={styles.label}>Aylık Kira Geliri</Text>
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
                    <Text style={styles.sectionTitle}>Tek Seferlik & Düzenli Giderler</Text>

                    <View style={styles.row}>
                        {/* Dues */}
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Aylık Aidat</Text>
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
                            <Text style={styles.label}>Tadilat</Text>
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
                            <Text style={styles.label}>Tapu Harcı</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Otomatik %4</Text>
                            </View>
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: Colors.dark.surface, color: '#94a3b8' }]}
                                placeholder="Fiyattan hesaplanır"
                                editable={false}
                                value={price ? `₺${(parseFloat(price) * 0.04).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : ''}
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
                        <Text style={styles.sectionTitle}>Finansman</Text>
                        <View style={styles.switchRow}>
                            <Switch
                                value={useLoan}
                                onValueChange={setUseLoan}
                                trackColor={{ true: Colors.dark.primary, false: Colors.dark.border }}
                            />
                            <Text style={styles.switchLabel}>Kredi Kullan</Text>
                        </View>
                    </View>

                    {useLoan && (
                        <View style={styles.loanCard}>
                            {/* Down Payment */}
                            <View style={styles.loanInputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Peşinat Oranı</Text>
                                    <Text style={styles.loanRateValue}>%{downPaymentPercent}</Text>
                                </View>
                                <Slider
                                    style={{ flex: 1, height: 40 }}
                                    minimumValue={10}
                                    maximumValue={50}
                                    step={5}
                                    value={downPaymentPercent}
                                    onValueChange={setDownPaymentPercent}
                                    minimumTrackTintColor={Colors.dark.primary}
                                    maximumTrackTintColor={Colors.dark.border}
                                    thumbTintColor={Colors.dark.primary}
                                />
                                {price && (
                                    <Text style={styles.helperText}>
                                        Peşinat: ₺{(parseFloat(price) * downPaymentPercent / 100).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                    </Text>
                                )}
                            </View>

                            {/* Loan Rate */}
                            <View style={styles.loanInputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Aylık Faiz Oranı</Text>
                                    <Text style={styles.loanRateValue}>%{loanRate.toFixed(2)}</Text>
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

                            {/* Loan Term */}
                            <View style={styles.loanInputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Kredi Vadesi</Text>
                                    <Text style={styles.loanRateValue}>{loanTerm} Ay ({(loanTerm / 12).toFixed(0)} Yıl)</Text>
                                </View>
                                <Slider
                                    style={{ flex: 1, height: 40 }}
                                    minimumValue={12}
                                    maximumValue={180}
                                    step={12}
                                    value={loanTerm}
                                    onValueChange={setLoanTerm}
                                    minimumTrackTintColor={Colors.dark.primary}
                                    maximumTrackTintColor={Colors.dark.border}
                                    thumbTintColor={Colors.dark.primary}
                                />
                            </View>

                            {/* Loan Preview */}
                            {loanPreview && (
                                <View style={styles.loanPreview}>
                                    <View style={styles.loanPreviewRow}>
                                        <Text style={styles.loanPreviewLabel}>Kredi Tutarı</Text>
                                        <Text style={styles.loanPreviewValue}>
                                            ₺{loanPreview.loanAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                        </Text>
                                    </View>
                                    <View style={styles.loanPreviewRow}>
                                        <Text style={styles.loanPreviewLabel}>Aylık Taksit</Text>
                                        <Text style={[styles.loanPreviewValue, { color: '#ef4444' }]}>
                                            ₺{loanPreview.monthlyPayment.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                        </Text>
                                    </View>
                                    <View style={styles.loanPreviewRow}>
                                        <Text style={styles.loanPreviewLabel}>Toplam Aylık Gider (Aidat + Taksit)</Text>
                                        <Text style={[styles.loanPreviewValue, { color: '#f59e0b' }]}>
                                            ₺{loanPreview.totalExpenses.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                {/* Projections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Değer Artış Tahmini</Text>
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Yıllık Tahmini Değer Artışı</Text>
                            <Text style={styles.loanRateValue}>%{appreciationRate}</Text>
                        </View>
                        <Slider
                            style={{ flex: 1, height: 40 }}
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                            value={appreciationRate}
                            onValueChange={setAppreciationRate}
                            minimumTrackTintColor={Colors.dark.primary}
                            maximumTrackTintColor={Colors.dark.border}
                            thumbTintColor={Colors.dark.primary}
                        />
                        <Text style={styles.helperTextSmall}>
                            💡 Türkiye'de yüksek enflasyon ortamında emlak değer artışı genelde %30-80 arasında seyreder.
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Market Comparison Info - From Regional Data */}
                {selectedLocation && selectedLocation.avg_price_per_sqm && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Piyasa Verileri</Text>
                        <View style={styles.marketInfoCard}>
                            <View style={styles.marketInfoHeader}>
                                <MaterialIcons name="insights" size={24} color={Colors.dark.primary} />
                                <Text style={styles.marketInfoTitle}>{selectedLocation.display_name}</Text>
                            </View>
                            <View style={styles.marketInfoGrid}>
                                <View style={styles.marketInfoItem}>
                                    <Text style={styles.marketInfoLabel}>Ort. m² Fiyatı</Text>
                                    <Text style={styles.marketInfoValue}>
                                        ₺{selectedLocation.avg_price_per_sqm.toLocaleString('tr-TR')}
                                    </Text>
                                </View>
                                {selectedLocation.avg_rent_per_sqm && (
                                    <View style={styles.marketInfoItem}>
                                        <Text style={styles.marketInfoLabel}>Ort. Kira (100m²)</Text>
                                        <Text style={styles.marketInfoValue}>
                                            ₺{(selectedLocation.avg_rent_per_sqm * 100).toLocaleString('tr-TR')}/ay
                                        </Text>
                                    </View>
                                )}
                                {selectedLocation.avg_dues && (
                                    <View style={styles.marketInfoItem}>
                                        <Text style={styles.marketInfoLabel}>Ort. Aidat</Text>
                                        <Text style={styles.marketInfoValue}>
                                            ₺{selectedLocation.avg_dues.toLocaleString('tr-TR')}/ay
                                        </Text>
                                    </View>
                                )}
                                {selectedLocation.appreciation_rate && (
                                    <View style={styles.marketInfoItem}>
                                        <Text style={styles.marketInfoLabel}>Yıllık Değer Artışı</Text>
                                        <Text style={styles.marketInfoValue}>
                                            %{selectedLocation.appreciation_rate}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {sqm && price && (
                                <View style={styles.marketComparisonResult}>
                                    {(() => {
                                        const propertyPricePerSqm = parseFloat(price) / parseFloat(sqm);
                                        const diff = propertyPricePerSqm - selectedLocation.avg_price_per_sqm;
                                        const diffPercent = (diff / selectedLocation.avg_price_per_sqm) * 100;
                                        const isBelowMarket = diff < 0;

                                        return (
                                            <>
                                                <MaterialIcons
                                                    name={isBelowMarket ? "trending-down" : "trending-up"}
                                                    size={20}
                                                    color={isBelowMarket ? "#10b981" : "#ef4444"}
                                                />
                                                <Text style={[
                                                    styles.marketComparisonText,
                                                    { color: isBelowMarket ? '#10b981' : '#ef4444' }
                                                ]}>
                                                    Bu mülk piyasanın %{Math.abs(diffPercent).toFixed(1)} {isBelowMarket ? 'altında' : 'üstünde'}
                                                </Text>
                                            </>
                                        );
                                    })()}
                                </View>
                            )}
                        </View>
                    </View>
                )}

            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
                <TouchableOpacity
                    style={styles.calculateButton}
                    onPress={calculate}
                    disabled={loading}
                >
                    <Text style={styles.calculateButtonText}>{loading ? 'Hesaplanıyor...' : 'Analiz Et'}</Text>
                    <View style={styles.costBadge}>
                        <Text style={styles.costText}>2 Kredi</Text>
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
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
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
    helperText: {
        fontSize: 12,
        color: Colors.dark.primary,
        marginTop: 6,
        marginLeft: 4,
    },
    helperTextSmall: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 8,
        marginLeft: 4,
        lineHeight: 16,
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
    loanInputGroup: {
        marginBottom: 16,
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

    // Loan Preview
    loanPreview: {
        backgroundColor: Colors.dark.background,
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    loanPreviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    loanPreviewLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    loanPreviewValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },

    // Comparables
    comparablesCard: {
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
        padding: 16,
    },
    comparablesDescription: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 16,
        lineHeight: 18,
    },
    comparableRow: {
        marginBottom: 16,
    },
    comparableLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#cbd5e1',
        marginBottom: 8,
    },
    comparableInputs: {
        flexDirection: 'row',
    },
    comparablePricePerSqm: {
        fontSize: 11,
        color: Colors.dark.primary,
        marginTop: 4,
        marginLeft: 4,
    },
    comparableResult: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    comparableResultText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.primary,
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

    // Market Info Card Styles
    marketInfoCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    marketInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    marketInfoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
        flex: 1,
    },
    marketInfoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    marketInfoItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.dark.background,
        borderRadius: 8,
        padding: 12,
    },
    marketInfoLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    marketInfoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    marketComparisonResult: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    marketComparisonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
