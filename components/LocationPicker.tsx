import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LocationOption {
    id: string;
    city: string;
    display_name: string;
    level: 'city';
    avg_price_per_sqm?: number;
    avg_rent_per_sqm?: number;
    avg_dues?: number;
    appreciation_rate?: number;
}

interface LocationPickerProps {
    value: LocationOption | null;
    onSelect: (location: LocationOption) => void;
    placeholder?: string;
    label?: string;
}

export function LocationPicker({
    value,
    onSelect,
    placeholder = 'Şehir seçin...',
    label = 'Şehir',
}: LocationPickerProps) {
    const insets = useSafeAreaInsets();
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [options, setOptions] = useState<LocationOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const searchInputRef = useRef<TextInput>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load all locations on mount
    useEffect(() => {
        loadAllLocations();
    }, []);

    const loadAllLocations = async () => {
        setInitialLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_locations');
            if (!error && data) {
                setOptions(data);
            }
        } catch (err) {
            console.error('Failed to load locations:', err);
        } finally {
            setInitialLoading(false);
        }
    };

    const searchLocations = useCallback(async (query: string) => {
        if (query.length < 2) {
            loadAllLocations();
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('search_locations', {
                p_query: query,
                p_limit: 15,
            });

            if (!error && data) {
                setOptions(data);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);

        // Debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchLocations(text);
        }, 300);
    };

    const handleSelect = (option: LocationOption) => {
        onSelect(option);
        setModalVisible(false);
        setSearchQuery('');
        Keyboard.dismiss();
    };

    const openModal = () => {
        setModalVisible(true);
        // Focus search input after modal opens
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    const renderOption = ({ item }: { item: LocationOption }) => (
        <TouchableOpacity
            style={styles.optionItem}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.optionIcon, { backgroundColor: '#f59e0b20' }]}>
                <MaterialIcons name="location-on" size={20} color="#f59e0b" />
            </View>
            <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{item.display_name}</Text>
                <View style={styles.optionMeta}>
                    <View style={[styles.levelBadge, { backgroundColor: '#f59e0b20' }]}>
                        <Text style={[styles.levelBadgeText, { color: '#f59e0b' }]}>
                            Şehir
                        </Text>
                    </View>
                    {item.avg_price_per_sqm && (
                        <Text style={styles.optionPrice}>
                            m²: ₺{item.avg_price_per_sqm.toLocaleString('tr-TR')}
                        </Text>
                    )}
                </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#64748b" />
        </TouchableOpacity>
    );

    return (
        <>
            {/* Trigger Button */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TouchableOpacity style={styles.selectButton} onPress={openModal} activeOpacity={0.7}>
                    {value ? (
                        <View style={styles.selectedValue}>
                            <MaterialIcons name="location-on" size={18} color="#f59e0b" />
                            <Text style={styles.selectedText} numberOfLines={1}>
                                {value.display_name}
                            </Text>
                            <View style={[styles.levelBadgeSmall, { backgroundColor: '#f59e0b20' }]}>
                                <Text style={[styles.levelBadgeTextSmall, { color: '#f59e0b' }]}>
                                    Şehir
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <MaterialIcons name="search" size={18} color="#64748b" />
                            <Text style={styles.placeholderText}>{placeholder}</Text>
                        </View>
                    )}
                    <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />
                </TouchableOpacity>
                {value && value.avg_price_per_sqm && (
                    <Text style={styles.helperText}>
                        💡 {value.city} ort.: m²: ₺{value.avg_price_per_sqm.toLocaleString('tr-TR')}
                    </Text>
                )}
            </View>

            {/* Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <MaterialIcons name="close" size={24} color={Colors.dark.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Şehir Seçin</Text>
                        <View style={styles.closeButton} />
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputWrapper}>
                            <MaterialIcons name="search" size={20} color="#64748b" />
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder="Şehir ara..."
                                placeholderTextColor="#64748b"
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                autoCapitalize="words"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearchChange('')}>
                                    <MaterialIcons name="cancel" size={18} color="#64748b" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Options List */}
                    {(loading || initialLoading) ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.dark.primary} />
                            <Text style={styles.loadingText}>Şehirler yükleniyor...</Text>
                        </View>
                    ) : options.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="location-off" size={48} color="#64748b" />
                            <Text style={styles.emptyText}>Şehir bulunamadı</Text>
                            <Text style={styles.emptySubtext}>Farklı bir arama terimi deneyin</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.id}
                            renderItem={renderOption}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}

                    {/* Helper Text */}
                    <View style={styles.modalFooter}>
                        <Text style={styles.footerText}>
                            💡 Sadece Türkiye içindeki şehirleri kapsar
                        </Text>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // Input Group
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
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingHorizontal: 16,
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
    },
    selectedValue: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    placeholderContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 16,
        color: '#64748b',
    },
    helperText: {
        fontSize: 11,
        color: '#10b981',
        marginTop: 6,
        marginLeft: 4,
    },

    // Level Badges
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    levelBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    levelBadgeSmall: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
    },
    levelBadgeTextSmall: {
        fontSize: 10,
        fontWeight: '600',
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Manrope_700Bold',
        color: Colors.dark.text,
    },

    // Search
    searchContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 48,
        paddingHorizontal: 16,
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark.text,
        fontFamily: 'Manrope_500Medium',
    },

    // List
    listContent: {
        padding: 16,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        gap: 12,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontFamily: 'Manrope_600SemiBold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    optionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    optionPrice: {
        fontSize: 12,
        color: '#94a3b8',
        fontFamily: 'Manrope_400Regular',
    },
    separator: {
        height: 8,
    },

    // States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#94a3b8',
        fontFamily: 'Manrope_400Regular',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Manrope_600SemiBold',
        color: Colors.dark.text,
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        fontFamily: 'Manrope_400Regular',
    },

    // Footer
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        fontFamily: 'Manrope_400Regular',
    },
});
