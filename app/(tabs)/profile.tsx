import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        fetchProfile();
        setEmail(user.email || '');
    }, [user]);

    async function fetchProfile() {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
            if (data) {
                setProfile(data);
                setFullName(data.full_name || '');
                setEmail(user?.email || '');
                setPhone(data.phone || '');
            }
        } finally {
            setLoading(false);
        }
    }

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
            Alert.alert('Error', 'Error picking image');
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

            fetchProfile();
            Alert.alert('Success', 'Profile photo updated!');

        } catch (error: any) {
            Alert.alert('Error uploading image', error.message);
        } finally {
            setUploading(false);
        }
    };

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
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
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Profile updated successfully.');
            fetchProfile(); // refresh data
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>

                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={saveProfile}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

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
                                <Text style={styles.profileName}>{fullName || 'User'}</Text>
                                <Text style={styles.profileRole}>Real Estate Agent</Text>
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
                                <Text style={styles.balanceLabel}>BALANCE</Text>
                                <Text style={styles.balanceValue}>
                                    {profile?.credit_balance ?? 0} <Text style={styles.balanceUnit}>credits</Text>
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.topUpButton} onPress={() => router.push('/wallet')}>
                            <MaterialIcons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.topUpText}>Top Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
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
                        <Text style={styles.label}>Email Address</Text>
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
                        <Text style={styles.label}>Phone Number</Text>
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

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.preferencesList}>
                        {/* Notifications */}
                        <TouchableOpacity style={styles.preferenceItem}>
                            <View style={styles.preferenceLeft}>
                                <View style={styles.preferenceIconBg}>
                                    <MaterialIcons name="notifications" size={24} color={Colors.dark.primary} />
                                </View>
                                <View>
                                    <Text style={styles.preferenceTitle}>Notifications</Text>
                                    <Text style={styles.preferenceSubtitle}>Push, Email & SMS</Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                        </TouchableOpacity>

                        <View style={styles.listDivider} />

                        {/* Payment Methods */}
                        <TouchableOpacity style={styles.preferenceItem}>
                            <View style={styles.preferenceLeft}>
                                <View style={styles.preferenceIconBg}>
                                    <MaterialIcons name="payments" size={24} color={Colors.dark.primary} />
                                </View>
                                <View>
                                    <Text style={styles.preferenceTitle}>Payment Methods</Text>
                                    <Text style={styles.preferenceSubtitle}>Manage cards & billing</Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                        </TouchableOpacity>

                        <View style={styles.listDivider} />

                        {/* Security */}
                        <TouchableOpacity style={styles.preferenceItem}>
                            <View style={styles.preferenceLeft}>
                                <View style={styles.preferenceIconBg}>
                                    <MaterialIcons name="lock" size={24} color={Colors.dark.primary} />
                                </View>
                                <View>
                                    <Text style={styles.preferenceTitle}>Security</Text>
                                    <Text style={styles.preferenceSubtitle}>Password & 2FA</Text>
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
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>Version 2.4.0</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.dark.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    saveText: {
        fontSize: 16,
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
        fontWeight: '500',
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
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    balanceUnit: {
        fontSize: 14,
        fontWeight: '500',
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
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: 'bold',
        fontSize: 14,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
});
