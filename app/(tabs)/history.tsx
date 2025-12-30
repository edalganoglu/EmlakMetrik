import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data items for design matching when backend is empty
const MOCK_ITEMS = [
  {
    id: 'mock-1',
    title: '123 Maple Ave',
    price: '12500',
    location: 'Springfield',
    status: 'completed',
    date: 'Today, 10:30 AM',
    tag: 'Renovation'
  },
  {
    id: 'mock-2',
    title: '404 Ocean Dr',
    price: null,
    location: 'Miami',
    status: 'draft',
    date: 'Yesterday, 4:15 PM',
    tag: 'Repairs'
  },
];

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setProperties(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (item: any, isMock = false) => {
    // Simple logic to determine status/style based on data
    // For real data: check if 'results' field is populated -> Completed, else Draft
    const isDraft = isMock ? item.status === 'draft' : (!item.params?.results);
    const title = item.title || 'Untitled Analysis';
    const priceFormatted = item.price
      ? `$${Number(item.price).toLocaleString()}`
      : (isMock && item.status === 'draft' ? '--' : '$0');

    // Date formatting
    const dateStr = isMock ? item.date : new Date(item.created_at).toLocaleDateString();

    // Icon background style
    let iconBg: any = styles.iconBgBlue;
    let iconName: any = "location-on";
    let iconColor = Colors.light.primary;

    if (isDraft) {
      iconBg = styles.iconBgAmber;
      iconName = "edit-note";
      iconColor = "#d97706"; // amber-600
    } else {
      // Maybe add logic for 'unlocked' or 'paid' later
      iconBg = styles.iconBgBlue;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => {
          // Navigate only if it's a real item or we handle mocks properly
          if (!isMock) router.push(`/analysis/${item.id}`);
        }}
      >
        {/* Thumbnail Icon */}
        <View style={[styles.thumbnail, iconBg]}>
          <MaterialIcons name={iconName} size={28} color={iconColor} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
            <Text style={isDraft ? styles.cardPriceDraft : styles.cardPrice}>{priceFormatted}</Text>
          </View>

          <View style={[styles.rowBetween, { alignItems: 'flex-end', marginTop: 4 }]}>
            <View>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {isMock ? `${item.location} • ${item.tag}` : `Location • Analysis`}
              </Text>
              <Text style={styles.cardDate}>{dateStr}</Text>
            </View>

            {isDraft ? (
              <View style={styles.badgeDraft}>
                <Text style={styles.badgeTextDraft}>DRAFT</Text>
              </View>
            ) : (
              <View style={styles.badgeCompleted}>
                <Text style={styles.badgeTextCompleted}>COMPLETED</Text>
              </View>
            )}

          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analysis History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search address, city, or analysis..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {['All', 'Completed', 'Drafts', 'Paid'].map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {/* Section: This Week */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
        </View>

        {/* Combine Mock items and Real items for display purposes if real items are empty to show design */}
        {/* In production, remove MOCK_ITEMS or only show if user has no data */}
        {MOCK_ITEMS.map(item => renderItem(item, true))}
        {properties.map(item => renderItem(item))}

        {/* Section: October 2023 (Static Mock Example) */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>OCTOBER 2023</Text>
        </View>

        {/* Static Mock Item for Month */}
        <TouchableOpacity style={styles.card}>
          <View style={[styles.thumbnail, styles.iconBgPurple]}>
            <MaterialIcons name="verified" size={28} color="#9333ea" />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>782 Pine Hill Rd</Text>
              <Text style={styles.cardPrice}>$450,000</Text>
            </View>
            <View style={[styles.rowBetween, { alignItems: 'flex-end', marginTop: 4 }]}>
              <View>
                <Text style={styles.cardSubtitle}>Austin • Full Build</Text>
                <Text style={styles.cardDate}>Oct 24, 2023</Text>
              </View>
              <View style={styles.badgeUnlocked}>
                <MaterialIcons name="lock-open" size={12} color="#7e22ce" style={{ marginRight: 2 }} />
                <Text style={styles.badgeTextUnlocked}>UNLOCKED</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/calculator')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(246, 246, 248, 0.95)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // hover handled by opacity
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0f172a',
  },

  // Filters
  filtersContainer: {
    paddingVertical: 12,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  chip: {
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 112, // space for fab
  },
  sectionHeader: {
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#f6f6f8', // sticky feel
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBgBlue: {
    backgroundColor: '#dbeafe', // blue 100
  },
  iconBgAmber: {
    backgroundColor: '#fef3c7', // amber 100
  },
  iconBgPurple: {
    backgroundColor: '#f3e8ff', // purple 100
  },
  cardContent: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  cardPriceDraft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  cardDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Badges
  badgeCompleted: {
    backgroundColor: '#f0fdf4', // green 50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  badgeTextCompleted: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803d', // green 700
  },
  badgeDraft: {
    backgroundColor: '#fffbeb', // amber 50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  badgeTextDraft: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b45309', // amber 700
  },
  badgeUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff', // purple 50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  badgeTextUnlocked: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7e22ce', // purple 700
  },

  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
