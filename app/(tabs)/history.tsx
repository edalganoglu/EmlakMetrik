import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock items removed, we are using real data now.


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

      if (data) {
        setProperties(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProperties = () => {
    let filtered = properties;

    // Apply search filter
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(lowerCaseSearch) ||
        p.address?.toLowerCase().includes(lowerCaseSearch) ||
        p.location?.toLowerCase().includes(lowerCaseSearch) ||
        p.tag?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Apply status filter
    if (filter === 'All') return filtered;
    if (filter === 'Completed') return filtered.filter(p => p.status === 'completed');
    if (filter === 'Drafts') return filtered.filter(p => p.status === 'draft');
    if (filter === 'Paid') return filtered.filter(p => p.is_unlocked);
    return filtered;
  };

  const renderItem = (item: any) => {
    const isDraft = item.status === 'draft';
    const title = item.title || item.address || 'Untitled Analysis'; // Fallback to address or default
    const priceFormatted = item.price
      ? `₺${Number(item.price).toLocaleString()}`
      : '₺0';

    const dateStr = new Date(item.created_at).toLocaleDateString();

    // Icon background style
    let iconBg: any = styles.iconBgBlue;
    let iconName: any = "location-on";
    let iconColor = '#60a5fa'; // blue 400

    if (isDraft) {
      iconBg = styles.iconBgAmber;
      iconName = "edit-note";
      iconColor = "#fbbf24"; // amber 400
    } else if (item.is_unlocked) {
      iconBg = styles.iconBgPurple;
      iconName = "verified";
      iconColor = "#c084fc"; // purple 400
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => router.push(`/analysis/${item.id}`)}
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
                {item.location || 'Unknown Location'} • {item.tag || 'Analysis'}
              </Text>
              <Text style={styles.cardDate}>{dateStr}</Text>
            </View>

            {isDraft ? (
              <View style={styles.badgeDraft}>
                <Text style={styles.badgeTextDraft}>DRAFT</Text>
              </View>
            ) : item.is_unlocked ? (
              <View style={styles.badgeUnlocked}>
                <MaterialIcons name="lock-open" size={12} color="#c084fc" style={{ marginRight: 2 }} />
                <Text style={styles.badgeTextUnlocked}>UNLOCKED</Text>
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
          <MaterialIcons name="filter-list" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search address, city, or analysis..."
            placeholderTextColor="#64748b"
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
          <Text style={styles.sectionTitle}>ALL ANALYSES</Text>
        </View>

        {loading ? (
          <View style={{ padding: 20 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.card}>
                <Skeleton width={56} height={56} borderRadius={12} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={60} height={16} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width={150} height={12} />
                    <Skeleton width={80} height={20} borderRadius={6} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : getFilteredProperties().length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8' }}>No analysis found.</Text>
          </View>
        ) : (
          getFilteredProperties().map(item => renderItem(item))
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
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Colors.dark.text,
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
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
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
    backgroundColor: Colors.dark.background, // sticky feel
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue 500 20%
  },
  iconBgAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)', // amber 500 20%
  },
  iconBgPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)', // purple 500 20%
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
    color: Colors.dark.text,
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80', // green 400
  },
  cardPriceDraft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // Badges
  badgeCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // green 500 15%
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeTextCompleted: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4ade80', // green 400
  },
  badgeDraft: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeTextDraft: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fbbf24', // amber 400
  },
  badgeUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeTextUnlocked: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#c084fc', // purple 400
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
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
