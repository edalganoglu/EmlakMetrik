import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const router = useRouter();
    // Removed local profile state as we use global profile
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Refresh profile when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [])
    );

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
            // email usually comes from auth user, but sync just in case
        }
        if (user) {
            setEmail(user.email || '');
        }
    }, [profile, user]);

    // Removed fetchProfile since data comes from Context

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshProfile();
        setRefreshing(false);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                uploadAvatar(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Hata', 'Fotoğraf seçilirken hata oluştu');
        }
    };

    const uploadAvatar = async (uri: string) => {
        try {
            setUploading(true);
            const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
            const filePath = `${user!.id}/${new Date().getTime()}.jpg`;
            const contentType = 'image/jpeg';

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, decode(base64), { contentType });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: data.publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user!.id);

            if (updateError) throw updateError;

            refreshProfile();
            Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi!');

        } catch (error: any) {
            Alert.alert('Fotoğraf yüklenirken hata', error.message);
        } finally {
            setUploading(false);
        }
    };

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Hata', error.message);
    }

    async function saveProfile() {
        setLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone: phone,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user!.id);

        setLoading(false);

        if (error) {
            Alert.alert('Hata', error.message);
        } else {
            Alert.alert('Başarılı', 'Profil başarıyla güncellendi.');
            refreshProfile(); // refresh data
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>

                <Text style={styles.headerTitle}>Profil</Text>
                <TouchableOpacity onPress={saveProfile}>
                    <Text style={styles.saveText}>Kaydet</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    {loading ? (
                        <>
                            <Skeleton width={128} height={128} borderRadius={64} style={{ marginBottom: 16 }} />
                            <Skeleton width={150} height={24} style={{ marginBottom: 4 }} />
                            <Skeleton width={100} height={16} />
                        </>
                    ) : (
                        <>
                            <View style={styles.avatarContainer}>
                                {uploading ? (
                                    <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.surface }]}>
                                        <ActivityIndicator color={Colors.dark.primary} />
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: profile?.avatar_url || 'https://placehold.co/200' }}
                                        style={styles.avatar}
                                    />
                                )}
                                <TouchableOpacity style={styles.cameraButton} onPress={pickImage} disabled={uploading}>
                                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{fullName || 'Kullanıcı'}</Text>
                                <Text style={styles.profileRole}>Emlak Danışmanı</Text>
                            </View>
                        </>
                    )}

                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        {loading ? (
                            <View>
                                <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                                <Skeleton width={100} height={24} />
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.balanceLabel}>BAKİYE</Text>
                                <Text style={styles.balanceValue}>
                                    {profile?.credit_balance ?? 0} <Text style={styles.balanceUnit}>kredi</Text>
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.topUpButton} onPress={() => router.push('/wallet')}>
                            <MaterialIcons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.topUpText}>Yükle</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Kişisel Bilgiler */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ad Soyad</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                            <MaterialIcons name="person" size={20} color="#94a3b8" style={styles.inputIcon} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-posta Adresi</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />
                            <MaterialIcons name="mail" size={20} color="#94a3b8" style={styles.inputIcon} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Telefon Numarası</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                            <MaterialIcons name="call" size={20} color="#94a3b8" style={styles.inputIcon} />
                        </View>
                    </View>
                </View>

                {/* Tercihler */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tercihler</Text>
                    <View style={styles.preferencesList}>
                        {/* Bildirimler */}
                        <TouchableOpacity style={styles.preferenceItem} onPress={() => router.push('/notifications')}>
                            <View style={styles.preferenceLeft}>
                                <View style={styles.preferenceIconBg}>
                                    <MaterialIcons name="notifications" size={24} color={Colors.dark.primary} />
                                </View>
                                <View>
                                    <Text style={styles.preferenceTitle}>Bildirimler</Text>
                                    <Text style={styles.preferenceSubtitle}>Push, E-posta & SMS</Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                        </TouchableOpacity>

                        <View style={styles.listDivider} />

                        {/* Ödeme Yöntemleri */}
                        <TouchableOpacity style={styles.preferenceItem} onPress={() => router.push('/wallet')}>
                            <View style={styles.preferenceLeft}>
                                <View style={styles.preferenceIconBg}>
                                    <MaterialIcons name="payments" size={24} color={Colors.dark.primary} />
                                </View>
                                <View>
                                    <Text style={styles.preferenceTitle}>Ödeme Yöntemleri</Text>
                                    <Text style={styles.preferenceSubtitle}>Kredi satın al</Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                        </TouchableOpacity>

                        <View style={styles.listDivider} />

                        {/* Güvenlik */}
                        <TouchableOpacity style={styles.preferenceItem} onPress={() => router.push('/security')}>
                            <View style={styles.preferenceLeft}>
                                <View style={styles.preferenceIconBg}>
                                    <MaterialIcons name="lock" size={24} color={Colors.dark.primary} />
                                </View>
                                <View>
                                    <Text style={styles.preferenceTitle}>Güvenlik</Text>
                                    <Text style={styles.preferenceSubtitle}>Şifre değiştir</Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                        <MaterialIcons name="logout" size={18} color="#dc2626" />
                        <Text style={styles.logoutText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>Sürüm 2.4.0</Text>
                </View>

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
        backgroundColor: Colors.dark.background,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
    },
    saveText: {
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.primary,
    },
    content: {
        paddingBottom: 40,
    },

    // Profile Header
    profileHeader: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 4,
        borderColor: Colors.dark.surface,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.dark.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.dark.background,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileName: {
        fontSize: 24,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
        fontFamily: 'Manrope_500Medium',
        color: '#94a3b8',
    },

    // Balance
    balanceCard: {
        width: '100%',
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    balanceLabel: {
        fontSize: 12,
        fontFamily: 'Manrope_700Bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceValue: {
        fontSize: 24,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
    },
    balanceUnit: {
        fontSize: 14,
        fontFamily: 'Manrope_500Medium',
        color: '#94a3b8',
    },
    topUpButton: {
        backgroundColor: Colors.dark.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    topUpText: {
        color: '#fff',
        fontFamily: 'Manrope_700Bold',
        fontSize: 14,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginVertical: 8,
    },

    // Form Section
    section: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Manrope_600SemiBold',
        color: '#cbd5e1',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark.text,
    },
    inputIcon: {
        marginLeft: 8,
        opacity: 0.5,
    },

    // Preferences
    preferencesList: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        overflow: 'hidden',
    },
    preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    preferenceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    preferenceIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    preferenceTitle: {
        fontSize: 14,
        fontFamily: 'Manrope_600SemiBold',
        color: Colors.dark.text,
    },
    preferenceSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
    },
    listDivider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginLeft: 72, // aligns with text start
    },

    // Footer
    footer: {
        alignItems: 'center',
        gap: 16,
        paddingVertical: 32,
        paddingHorizontal: 16,
    },
    logoutButton: {
        width: '100%',
        height: 48,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontFamily: 'Manrope_700Bold',
        fontSize: 14,
    },
    versionText: {
        fontSize: 12,
        fontFamily: 'Manrope_500Medium',
        color: '#64748b',
    },
});
