import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MethodologyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Nasıl Çalışır?</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Intro */}
                <Text style={styles.introText}>
                    EmlakMetrik, gayrimenkul yatırımlarınızı analiz ederken bilimsel verileri ve doğrulanmış finansal formülleri kullanır. İşte sistemin çalışma mantığı:
                </Text>

                {/* 1. Veri Kaynağı */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="storage" size={24} color={Colors.dark.primary} />
                        <Text style={styles.sectionTitle}>1. Veri Kaynakları</Text>
                    </View>
                    <Text style={styles.text}>
                        Uygulamadaki bölgesel değer artış oranları, <Text style={styles.bold}>T.C. Merkez Bankası (TCMB)</Text> Elektronik Veri Dağıtım Sistemi (EVDS) üzerinden otomatik olarak çekilir.
                    </Text>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>
                            Her ay yayınlanan <Text style={styles.italic}>Konut Fiyat Endeksi (KFE)</Text> verileri baz alınır.
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>
                            İstanbul, Ankara, İzmir gibi büyükşehirler için doğrudan il verisi, diğer iller için ise NUTS-2 bölge verisi kullanılır.
                        </Text>
                    </View>
                </View>

                {/* 2. Değer Artış Hesabı */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="trending-up" size={24} color="#10b981" />
                        <Text style={styles.sectionTitle}>2. Değer Artış Tahmini</Text>
                    </View>
                    <Text style={styles.text}>
                        "Yıllık Artış Tahmini" sürgüsü, seçtiğiniz şehrin son 1 yıllık resmi değer artış oranına göre otomatik ayarlanır.
                    </Text>
                    <View style={styles.formulaBox}>
                        <Text style={styles.formulaLabel}>Hesaplama Yöntemi:</Text>
                        <Text style={styles.formula}>((Güncel Endeks - Geçen Yıl) / Geçen Yıl) × 100</Text>
                    </View>
                    <Text style={styles.text}>
                        Örneğin; bir şehrin endeksi geçen yıl 1000, bu yıl 1547.2 ise, yıllık artış oranı <Text style={styles.bold}>%54.72</Text> olarak sisteme yansır.
                    </Text>
                </View>

                {/* 3. Finansal Metrikler */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="calculate" size={24} color="#f59e0b" />
                        <Text style={styles.sectionTitle}>3. Finansal Metrikler</Text>
                    </View>

                    <Text style={styles.subTitle}>Amortisman Süresi</Text>
                    <Text style={styles.text}>
                        Yatırımın kendini kira geliriyle ne kadar sürede geri ödeyeceğini gösterir.
                    </Text>
                    <View style={styles.formulaBox}>
                        <Text style={styles.formula}>Toplam Maliyet / (Yıllık Kira - Yıllık Aidat)</Text>
                    </View>

                    <Text style={[styles.subTitle, { marginTop: 12 }]}>ROI (Yatırım Getirisi)</Text>
                    <Text style={styles.text}>
                        Yatırılan sermayenin yıllık getiri yüzdesidir. Kredi kullanıldıysa "Cash on Cash Return" (Nakte Nakit Getiri) hesaplanır.
                    </Text>
                    <View style={styles.formulaBox}>
                        <Text style={styles.formula}>(Yıllık Net Nakit Akışı / Cepten Çıkan Toplam Nakit) × 100</Text>
                    </View>
                </View>

                {/* 4. Vergi Hesapları */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="account-balance" size={24} color="#6366f1" />
                        <Text style={styles.sectionTitle}>4. Vergi ve Giderler</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>
                            <Text style={styles.bold}>Tapu Harcı:</Text> Satış fiyatının %4'ü olarak sabit hesaplanır.
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>
                            <Text style={styles.bold}>Emlak Vergisi:</Text> Türkiye ortalaması baz alınarak yıllık binde 2 (~%0.2) olarak tahmini bütçelenir.
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>
                            <Text style={styles.bold}>Bakım Gideri:</Text> Yıllık kira gelirinin %10'u yıpranma payı olarak ayrılır (Nakit akışında değil, detaylı gider analizinde gösterilir).
                        </Text>
                    </View>
                </View>

                {/* Footer Disclaimer */}
                <View style={styles.footer}>
                    <MaterialIcons name="info-outline" size={20} color="#94a3b8" />
                    <Text style={styles.footerText}>
                        Yasal Uyarı: Bu uygulamadaki hesaplamalar ve veriler bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir. Nihai yatırım kararlarınızı verirken profesyonel danışmanlık almanız önerilir.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    introText: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 22,
        marginBottom: 24,
        fontFamily: 'Manrope_400Regular',
    },
    section: {
        marginBottom: 32,
        backgroundColor: Colors.dark.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
    },
    text: {
        fontSize: 14,
        color: '#cbd5e1', // Slate 300
        lineHeight: 22,
        fontFamily: 'Manrope_400Regular',
    },
    subTitle: {
        fontSize: 14,
        fontFamily: 'Manrope_600SemiBold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    bold: {
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
    },
    italic: {
        fontFamily: 'Manrope_400Regular',
        fontStyle: 'italic',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    bullet: {
        fontSize: 14,
        color: Colors.dark.primary,
        fontFamily: 'Manrope_700Bold',
    },
    formulaBox: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)', // Indigo with opacity
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.dark.primary,
    },
    formulaLabel: {
        fontSize: 12,
        color: Colors.dark.primary,
        fontFamily: 'Manrope_600SemiBold',
        marginBottom: 4,
    },
    formula: {
        fontSize: 13,
        // fontFamily: 'monospace', // Keep monospace for formulas? User said ALL pages. Let's use Manrope Medium for numbers
        fontFamily: 'Manrope_500Medium',
        color: '#e2e8f0',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        marginTop: 8,
    },
    footerText: {
        flex: 1,
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 18,
        fontFamily: 'Manrope_400Regular',
    },
});
