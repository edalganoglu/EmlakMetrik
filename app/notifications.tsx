import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotificationPreferences = {
    push_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
};

const defaultPreferences: NotificationPreferences = {
    push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
};

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, profile, refreshProfile } = useAuth();

    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (profile?.notification_preferences) {
            setPreferences(profile.notification_preferences as NotificationPreferences);
        }
    }, [profile]);

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => {
            const newPrefs = { ...prev, [key]: !prev[key] };
            setHasChanges(true);
            return newPrefs;
        });
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    notification_preferences: preferences,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                Alert.alert('Hata', error.message);
            } else {
                Alert.alert('Başarılı', 'Bildirim tercihleriniz kaydedildi.');
                setHasChanges(false);
                refreshProfile();
            }
        } catch (error: any) {
            Alert.alert('Hata', 'Tercihler kaydedilirken bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const notificationOptions = [
        {
            key: 'push_enabled' as const,
            icon: 'notifications-active',
            title: 'Push Bildirimleri',
            description: 'Anlık bildirimler alın',
            badge: 'Yakında',
        },
        {
            key: 'email_enabled' as const,
            icon: 'email',
            title: 'E-posta Bildirimleri',
            description: 'Önemli güncellemeler e-posta ile',
        },
        {
            key: 'sms_enabled' as const,
            icon: 'sms',
            title: 'SMS Bildirimleri',
            description: 'Kritik bildirimler SMS ile',
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bildirimler</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!hasChanges || saving}
                    style={{ opacity: hasChanges ? 1 : 0.5 }}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={Colors.dark.primary} />
                    ) : (
                        <Text style={styles.saveText}>Kaydet</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoIconBg}>
                        <MaterialIcons name="notifications" size={24} color={Colors.dark.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTitle}>Bildirim Tercihleriniz</Text>
                        <Text style={styles.infoDesc}>
                            Hangi bildirim kanallarından haber almak istediğinizi seçin.
                        </Text>
                    </View>
                </View>

                {/* Notification Options */}
                <View style={styles.optionsList}>
                    {notificationOptions.map((option, index) => (
                        <View key={option.key}>
                            <View style={styles.optionItem}>
                                <View style={styles.optionLeft}>
                                    <View style={styles.optionIconBg}>
                                        <MaterialIcons name={option.icon as any} size={22} color={Colors.dark.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.optionTitleRow}>
                                            <Text style={styles.optionTitle}>{option.title}</Text>
                                            {option.badge && (
                                                <View style={styles.badge}>
                                                    <Text style={styles.badgeText}>{option.badge}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.optionDesc}>{option.description}</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={preferences[option.key]}
                                    onValueChange={() => handleToggle(option.key)}
                                    trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
                                    thumbColor={preferences[option.key] ? '#fff' : '#94a3b8'}
                                    ios_backgroundColor={Colors.dark.border}
                                />
                            </View>
                            {index < notificationOptions.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* Info Note */}
                <View style={styles.noteCard}>
                    <MaterialIcons name="info-outline" size={20} color="#64748b" />
                    <Text style={styles.noteText}>
                        Push bildirimleri için uygulamanın tam sürümü gereklidir.
                        E-posta bildirimleri profil e-posta adresinize gönderilir.
                    </Text>
                </View>

            </ScrollView>
        </View>
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
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
        textAlign: 'center',
    },
    saveText: {
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.primary,
    },
    content: {
        padding: 16,
        gap: 20,
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    infoIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTitle: {
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },

    // Options List
    optionsList: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        overflow: 'hidden',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        marginRight: 12,
    },
    optionIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    optionTitle: {
        fontSize: 15,
        fontFamily: 'Manrope_600SemiBold',
        color: Colors.dark.text,
    },
    optionDesc: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    badge: {
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Manrope_700Bold',
        color: '#fbbf24',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginLeft: 74,
    },

    // Note Card
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderLeftWidth: 3,
        borderLeftColor: '#64748b',
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 18,
    },
});
