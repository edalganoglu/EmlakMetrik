import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 10;

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory(0, true);

    const channel = supabase
      .channel('history_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New item added, refresh list to show it at top
            fetchHistory(0, true);
          } else if (payload.eventType === 'DELETE') {
            setProperties((prev) => prev.filter((item) => item.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setProperties((prev) => prev.map((item) => item.id === payload.new.id ? { ...item, ...payload.new } : item));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory(0, true);
    setRefreshing(false);
  };

  const fetchHistory = async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        // Only show loading spinner if it's an initial load, not a refresh
        if (!refreshing) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (reset) {
          setProperties(data);
        } else {
          setProperties(prev => [...prev, ...data]);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false); // Ensure refreshing stops
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchHistory(page + 1, false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'Analiz silinirken bir hata oluştu.');
    }
  };

  const confirmDelete = (item: any) => {
    Alert.alert(
      'Analizi Sil',
      `"${item.title || item.address || 'Bu analizi'}" silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteAnalysis(item.id)
        }
      ]
    );
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
    if (filter === 'PDF') return filtered.filter(p => p.pdf_generated);
    if (filter === 'New') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return filtered.filter(p => new Date(p.created_at) > sevenDaysAgo);
    }
    return filtered;
  };

  const renderRightActions = (item: any, progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [64, 0],
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={[styles.deleteButton, { transform: [{ translateX }, { scale }] }]}>
          <TouchableOpacity
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}
            onPress={() => {
              swipeableRefs.current.get(item.id)?.close();
              confirmDelete(item);
            }}
          >
            <MaterialIcons name="delete-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const title = item.title || item.address || 'İsimsiz Analiz';
    const priceFormatted = item.price
      ? `₺${Number(item.price).toLocaleString()}`
      : '₺0';

    const dateStr = new Date(item.created_at).toLocaleDateString('tr-TR');

    // Check if analysis is from last 7 days
    const createdDate = new Date(item.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isNew = createdDate > sevenDaysAgo;

    // Check if PDF was generated
    const hasPdf = item.pdf_generated === true;

    // Icon background style
    let iconBg: any = styles.iconBgBlue;
    let iconName: any = "location-on";
    let iconColor = '#60a5fa'; // blue 400

    if (hasPdf) {
      iconBg = styles.iconBgPurple;
      iconName = "picture-as-pdf";
      iconColor = "#c084fc"; // purple 400
    } else if (isNew) {
      iconBg = styles.iconBgGreen;
      iconName = "fiber-new";
      iconColor = "#4ade80"; // green 400
    }

    return (
      <View style={styles.cardContainer}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(item.id, ref);
          }}
          renderRightActions={(progress) => renderRightActions(item, progress)}
          overshootRight={false}
          friction={1.5}
          containerStyle={{ borderRadius: 16, overflow: 'hidden' }}
        >
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/analysis/${item.id}`)}
          >
            {/* Thumbnail Icon */}
            <View style={[styles.thumbnail, iconBg]}>
              <MaterialIcons name={iconName} size={28} color={iconColor} />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.cardPrice}>{priceFormatted}</Text>
              </View>

              <View style={[styles.rowBetween, { alignItems: 'flex-end', marginTop: 4 }]}>
                <View>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.location || 'Konum Belirtilmemiş'} • {item.tag || 'Analiz'}
                  </Text>
                  <Text style={styles.cardDate}>{dateStr}</Text>
                </View>

                {/* Badges: PDF veya YENİ */}
                {/* Öncelik sırası: PDF > YENİ */}
                {hasPdf ? (
                  <View style={styles.badgePdf}>
                    <MaterialIcons name="picture-as-pdf" size={12} color="#c084fc" style={{ marginRight: 2 }} />
                    <Text style={styles.badgeTextPdf}>PDF</Text>
                  </View>
                ) : isNew ? (
                  <View style={styles.badgeNew}>
                    <Text style={styles.badgeTextNew}>YENİ</Text>
                  </View>
                ) : null}

              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.dark.primary} />
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Section: Tüm Analizler */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TÜM ANALİZLER</Text>
      </View>
    </>
  );

  const filteredData = getFilteredProperties();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analiz Geçmişi</Text>
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
              placeholder="Adres, şehir veya analiz ara..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
            data={[
              { value: 'All', label: 'Tümü' },
              { value: 'PDF', label: 'PDF Raporlu' },
              { value: 'New', label: 'Yeni (Son 7 Gün)' }
            ]}
            keyExtractor={(item) => item.value}
            renderItem={({ item: f }) => {
              const isActive = filter === f.value;
              return (
                <TouchableOpacity
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setFilter(f.value)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* List */}
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
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8' }}>Analiz bulunamadı.</Text>
              </View>
            }
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/calculator')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>

      </SafeAreaView>
    </GestureHandlerRootView>
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
    fontFamily: 'Manrope_700Bold',
    color: Colors.dark.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
  },
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
    fontFamily: 'Manrope_500Medium',
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
    fontFamily: 'Manrope_500Medium',
    color: '#94a3b8',
  },
  chipTextActive: {
    color: '#fff',
    fontFamily: 'Manrope_600SemiBold',
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
    fontFamily: 'Manrope_700Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 12,
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
  iconBgGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)', // green 500 20%
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
    fontFamily: 'Manrope_700Bold',
    color: Colors.dark.text,
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: '#4ade80', // green 400
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: '#94a3b8',
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // Badges - YENİ (son 7 gün)
  badgeNew: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // green 500 15%
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeTextNew: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: '#4ade80', // green 400
  },

  // PDF badge
  badgePdf: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeTextPdf: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: '#c084fc', // purple 400
  },

  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Swipe to delete
  rightActionContainer: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    width: 64,  // Kare değil ama dikey dikdörtgen
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  // deleteText removed as we use icon only now

  // Loading footer
  loadingFooter: {
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

