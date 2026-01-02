import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Required for web browser auth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

    // For Expo Go, we need to use the Expo scheme
    // In production builds, this will use the custom scheme from app.json
    const redirectUrl = AuthSession.makeRedirectUri({
        // Don't specify native - let Expo handle it automatically
        // This will use exp:// in Expo Go and emlakmetrik:// in production
    });

    console.log('OAuth Redirect URL:', redirectUrl);

    async function handleAuth() {
        setLoading(true);
        if (activeTab === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: redirectUrl,
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

    async function handleGoogleSignIn() {
        try {
            setSocialLoading('google');

            console.log('Starting Google Sign In with redirect:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                console.log('Opening auth URL:', data.url);

                // Open the OAuth URL in browser
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                console.log('Auth result:', result.type);

                if (result.type === 'success' && result.url) {
                    console.log('Success URL:', result.url);

                    // Parse the URL to get tokens
                    const url = result.url;

                    // Try to extract from hash fragment first (implicit flow)
                    let accessToken: string | null = null;
                    let refreshToken: string | null = null;

                    // Check for hash params (after #)
                    const hashIndex = url.indexOf('#');
                    if (hashIndex !== -1) {
                        const hashPart = url.substring(hashIndex + 1);
                        const hashParams = new URLSearchParams(hashPart);
                        accessToken = hashParams.get('access_token');
                        refreshToken = hashParams.get('refresh_token');

                        console.log('Found tokens in hash:', !!accessToken, !!refreshToken);
                    }

                    // Try query params (PKCE flow with code)
                    if (!accessToken) {
                        const queryIndex = url.indexOf('?');
                        if (queryIndex !== -1) {
                            const queryPart = url.substring(queryIndex + 1);
                            // Remove hash if exists in query
                            const cleanQuery = queryPart.split('#')[0];
                            const queryParams = new URLSearchParams(cleanQuery);
                            const code = queryParams.get('code');

                            if (code) {
                                console.log('Found code, exchanging for session...');
                                const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                                if (exchangeError) {
                                    console.error('Exchange error:', exchangeError);
                                    throw exchangeError;
                                }
                                console.log('Session set successfully via code exchange');
                                return; // Session is set automatically
                            }
                        }
                    }

                    if (accessToken && refreshToken) {
                        console.log('Setting session with tokens...');
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) {
                            console.error('Session error:', sessionError);
                            throw sessionError;
                        }
                        console.log('Session set successfully via tokens');
                    } else {
                        console.log('No tokens or code found in URL');
                        // Try to get session anyway - might have been set via deep link
                        const { data: sessionData } = await supabase.auth.getSession();
                        if (sessionData?.session) {
                            console.log('Session found after auth');
                        }
                    }
                } else if (result.type === 'cancel') {
                    console.log('User cancelled');
                    return;
                } else if (result.type === 'dismiss') {
                    console.log('Browser dismissed');
                    // Check if session was set via another mechanism
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session) {
                        console.log('Session found after dismiss');
                    }
                }
            }
        } catch (error: any) {
            console.error('Google sign in error:', error);
            Alert.alert('Hata', error.message || 'Google ile giriş yapılamadı');
        } finally {
            setSocialLoading(null);
        }
    }

    async function handleAppleSignIn() {
        try {
            setSocialLoading('apple');

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl,
                    { showInRecents: true }
                );

                if (result.type === 'success') {
                    const url = result.url;
                    // Extract tokens from URL
                    const params = new URLSearchParams(url.split('#')[1]);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) throw sessionError;
                    }
                }
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Apple ile giriş yapılamadı');
        } finally {
            setSocialLoading(null);
        }
    }

    const [tabAnim] = useState(new Animated.Value(0));

    const handleTabChange = (tab: 'login' | 'signup') => {
        setActiveTab(tab);
        Animated.spring(tabAnim, {
            toValue: tab === 'login' ? 0 : 1,
            useNativeDriver: false,
            friction: 8,
            tension: 40
        }).start();
    };

    const left = tabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['1.5%', '50.5%']
    });

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

                {/* Animated Toggle Tabs */}
                <View style={styles.tabContainer}>
                    {/* Sliding Background */}
                    <Animated.View
                        style={[
                            styles.slidingIndicator,
                            {
                                left: left,
                            }
                        ]}
                    />

                    <TouchableOpacity
                        style={styles.tab}
                        onPress={() => handleTabChange('login')}
                    >
                        <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Giriş Yap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tab}
                        onPress={() => handleTabChange('signup')}
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
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleAppleSignIn}
                        disabled={socialLoading !== null}
                    >
                        {socialLoading === 'apple' ? (
                            <ActivityIndicator color={Colors.dark.text} size="small" />
                        ) : (
                            <>
                                <FontAwesome name="apple" size={20} color={Colors.dark.text} />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleGoogleSignIn}
                        disabled={socialLoading !== null}
                    >
                        {socialLoading === 'google' ? (
                            <ActivityIndicator color="#EA4335" size="small" />
                        ) : (
                            <>
                                <FontAwesome name="google" size={20} color="#EA4335" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </>
                        )}
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
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 14,
        padding: 5,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.3)',
        position: 'relative',
        height: 48,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        zIndex: 10,
    },
    slidingIndicator: {
        position: 'absolute',
        height: 38,
        width: '48%',
        top: 5,
        backgroundColor: Colors.dark.primary,
        borderRadius: 10,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 1,
    },
    activeTab: {
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(148, 163, 184, 0.6)',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '700',
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
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
});
