import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleAuth() {
        setLoading(true);
        if (activeTab === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: 'emlakmetrik://login',
                    data: {
                        full_name: email.split('@')[0],
                        avatar_url: 'https://placehold.co/150',
                    },
                },
            });
            if (error) Alert.alert('Hata', error.message);
            else Alert.alert('Başarılı', 'Lütfen doğrulama için e-postanızı kontrol edin!');
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) Alert.alert('Hata', error.message);
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(60, insets.top + 20), paddingBottom: insets.bottom + 20 }]}>

                {/* Header Logo Area */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoRow}>
                        <Image
                            source={require('@/assets/images/logo-vertical.png')}
                            style={{ width: 180, height: 60 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.heroTitle}>Güvenle Analiz Edin</Text>
                    <Text style={styles.heroSubtitle}>Maliyetleri takip edin ve kredilerinizi verimli yönetin.</Text>

                    <View style={styles.promoBadge}>
                        <MaterialIcons name="verified" size={16} color={Colors.dark.primary} />
                        <Text style={styles.promoText}>Kayıt olun ve 5 ücretsiz kredi kazanın</Text>
                    </View>
                </View>

                {/* Toggle Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                        onPress={() => setActiveTab('login')}
                    >
                        <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Giriş Yap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
                        onPress={() => setActiveTab('signup')}
                    >
                        <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>Kayıt Ol</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>

                    <Text style={styles.label}>E-posta Adresi</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="email" size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="name@example.com"
                            placeholderTextColor="#64748b"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.passwordHeader}>
                        <Text style={styles.label}>Şifre</Text>
                        {activeTab === 'login' && (
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Şifremi Unuttum</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifrenizi girin"
                            placeholderTextColor="#64748b"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.mainButtonText}>{activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>veya şunlarla devam edin</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social Buttons */}
                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton}>
                        <FontAwesome name="apple" size={20} color={Colors.dark.text} />
                        <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <FontAwesome name="google" size={20} color="#EA4335" />
                        <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Devam ederek EmlakMetrik'in şu koşullarını kabul etmiş olursunuz:
                    </Text>
                    <View style={styles.footerLinks}>
                        <Text style={styles.footerLink}>Kullanım Koşulları</Text>
                        <Text style={styles.footerText}> • </Text>
                        <Text style={styles.footerLink}>Gizlilik Politikası</Text>
                    </View>
                </View>

            </ScrollView>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 60,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.dark.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    promoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    promoText: {
        color: Colors.dark.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: Colors.dark.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
    },
    activeTabText: {
        color: Colors.dark.text,
    },
    formContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 16,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark.text,
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    forgotText: {
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    mainButton: {
        backgroundColor: Colors.dark.primary,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    mainButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.dark.border,
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#94a3b8',
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 40,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        height: 50,
        borderRadius: 12,
        gap: 8,
    },
    socialButtonText: {
        fontWeight: '600',
        color: Colors.dark.text,
        fontSize: 14,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
    },
    footerLinks: {
        flexDirection: 'row',
        marginTop: 4,
    },
    footerLink: {
        color: '#94a3b8', // keeping subtle
        fontSize: 12,
        fontWeight: '600',
    },
});
