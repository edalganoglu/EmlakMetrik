import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SecurityScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validatePassword = () => {
        if (newPassword.length < 6) {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
            return false;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Hata', 'Şifreler eşleşmiyor.');
            return false;
        }
        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePassword()) return;

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                Alert.alert('Hata', error.message);
            } else {
                Alert.alert(
                    'Başarılı',
                    'Şifreniz başarıyla güncellendi.',
                    [{ text: 'Tamam', onPress: () => router.back() }]
                );
            }
        } catch (error: any) {
            Alert.alert('Hata', 'Şifre güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Güvenlik</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIconBg}>
                            <MaterialIcons name="lock" size={24} color={Colors.dark.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoTitle}>Şifre Değiştir</Text>
                            <Text style={styles.infoDesc}>
                                Hesabınızın güvenliği için güçlü bir şifre kullanmanızı öneririz.
                            </Text>
                        </View>
                    </View>

                    {/* Password Form */}
                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Yeni Şifre</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="lock-outline" size={20} color="#94a3b8" style={styles.inputIconLeft} />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="En az 6 karakter"
                                    placeholderTextColor="#64748b"
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    <MaterialIcons
                                        name={showNewPassword ? "visibility" : "visibility-off"}
                                        size={20}
                                        color="#94a3b8"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Şifre Tekrar</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="lock-outline" size={20} color="#94a3b8" style={styles.inputIconLeft} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Şifrenizi tekrar girin"
                                    placeholderTextColor="#64748b"
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <MaterialIcons
                                        name={showConfirmPassword ? "visibility" : "visibility-off"}
                                        size={20}
                                        color="#94a3b8"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements */}
                        <View style={styles.requirementsCard}>
                            <Text style={styles.requirementsTitle}>Şifre Gereksinimleri</Text>
                            <View style={styles.requirementRow}>
                                <MaterialIcons
                                    name={newPassword.length >= 6 ? "check-circle" : "radio-button-unchecked"}
                                    size={16}
                                    color={newPassword.length >= 6 ? "#4ade80" : "#64748b"}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    newPassword.length >= 6 && { color: '#4ade80' }
                                ]}>
                                    En az 6 karakter
                                </Text>
                            </View>
                            <View style={styles.requirementRow}>
                                <MaterialIcons
                                    name={newPassword === confirmPassword && confirmPassword.length > 0 ? "check-circle" : "radio-button-unchecked"}
                                    size={16}
                                    color={newPassword === confirmPassword && confirmPassword.length > 0 ? "#4ade80" : "#64748b"}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    newPassword === confirmPassword && confirmPassword.length > 0 && { color: '#4ade80' }
                                ]}>
                                    Şifreler eşleşiyor
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!newPassword || !confirmPassword || loading) && styles.submitButtonDisabled
                        ]}
                        onPress={handleChangePassword}
                        disabled={!newPassword || !confirmPassword || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="save" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Şifreyi Güncelle</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
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
    content: {
        padding: 16,
        gap: 24,
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

    // Form
    formSection: {
        gap: 16,
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
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 16,
    },
    inputIconLeft: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark.text,
        fontFamily: 'Manrope_500Medium',
    },

    // Requirements
    requirementsCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        gap: 12,
    },
    requirementsTitle: {
        fontSize: 14,
        fontFamily: 'Manrope_600SemiBold',
        color: Colors.dark.text,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    requirementText: {
        fontSize: 14,
        color: '#64748b',
        fontFamily: 'Manrope_500Medium',
    },

    // Submit Button
    submitButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 12,
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
    },
});
