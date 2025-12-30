import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchProfile();
        setEmail(user.email || '');
    }, [user]);

    async function fetchProfile() {
        const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
        if (data) {
            setProfile(data);
            setFullName(data.full_name || '');
            // mock phone since we don't have it in schema
            setPhone('+1 (555) 123-4567');
        }
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
    }

    async function saveProfile() {
        // Mock save
        Alert.alert('Success', 'Profile saved successfully.');
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios-new" size={20} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={saveProfile}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: profile?.avatar_url || 'https://placehold.co/200' }}
                            style={styles.avatar}
                        />
                        <View style={styles.cameraButton}>
                            <MaterialIcons name="photo-camera" size={20} color="#fff" />
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{fullName || 'User'}</Text>
                        <Text style={styles.profileRole}>Real Estate Agent</Text>
                    </View>

                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        <View>
                            <Text style={styles.balanceLabel}>BALANCE</Text>
                            <Text style={styles.balanceValue}>
                                {profile?.credit_balance ?? 0} <Text style={styles.balanceUnit}>credits</Text>
                            </Text>
                        </View>
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
                                    <MaterialIcons name="notifications" size={24} color={Colors.light.primary} />
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
                                    <MaterialIcons name="payments" size={24} color={Colors.light.primary} />
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
                                    <MaterialIcons name="lock" size={24} color={Colors.light.primary} />
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
        backgroundColor: '#f6f6f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(246, 246, 248, 0.8)', // semi-transparent match bg
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(226, 232, 240, 0.5)',
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
        color: '#0f172a',
    },
    saveText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.primary,
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
        borderColor: '#fff',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.light.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },

    // Balance
    balanceCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    balanceLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    balanceUnit: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    topUpButton: {
        backgroundColor: Colors.light.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: Colors.light.primary,
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
        backgroundColor: '#e2e8f0',
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
        color: '#0f172a',
        marginBottom: 4,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
    },
    inputIcon: {
        marginLeft: 8,
        opacity: 0.5,
    },

    // Preferences
    preferencesList: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
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
        backgroundColor: 'rgba(19, 91, 236, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    preferenceTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    preferenceSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    listDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
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
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    logoutText: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 14,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94a3b8',
    },
});
