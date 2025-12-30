import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: propData } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propData) setProperties(propData);

    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.appTitleContainer}>
          <View style={styles.appIconWrapper}>
            <MaterialIcons name="apartment" size={24} color={Colors.dark.primary} />
          </View>
          <Text style={styles.appTitle}>Emlak Asistanı</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.dark.icon} />
        </TouchableOpacity>
      </View>

      {/* Profile Card Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://placehold.co/150' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.greetingText}>Hoşgeldin,</Text>
              <Text style={styles.userName}>{profile?.full_name || user?.email?.split('@')[0]}</Text>
            </View>
          </View>

          {/* Credit Badge */}
          <TouchableOpacity onPress={() => router.push('/wallet')}>
            <View style={styles.creditBadgeContainer}>
              <View style={styles.creditLabelRow}>
                <MaterialIcons name="account-balance-wallet" size={20} color={Colors.dark.primary} />
                <Text style={styles.creditLabel}>Bakiye Durumu</Text>
              </View>
              <View style={styles.creditValueBadge}>
                <Text style={styles.creditValueText}>{profile?.credit_balance ?? 0} Kredi</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Analysis Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Son Analizler</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProperty = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.cardImageWrapper}>
        <Image
          source={{ uri: 'https://placehold.co/150' }} // Placeholder logic needs improvement later
          style={styles.cardImage}
        />
      </View>

      {/* Center Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {/* Mocking params for now since we don't have them fully structured */}
          3+1, 120m² • {new Date(item.created_at).toLocaleDateString()}
        </Text>

        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>TAMAMLANDI</Text>
        </View>
      </View>

      {/* Price */}
      <View style={styles.cardPriceContainer}>
        <Text style={styles.cardPrice}>
          {/* Simple formatting for Millions/Thousands */}
          {Number(item.price) >= 1000000
            ? `₺${(Number(item.price) / 1000000).toFixed(1)}M`
            : `₺${(Number(item.price) / 1000).toFixed(0)}K`}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={renderProperty}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Henüz analiz yok.</Text>
            <TouchableOpacity onPress={() => router.push('/calculator')}>
              <Text style={styles.linkText}>Yeni Analiz Oluştur</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        contentContainerStyle={styles.contentList}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/calculator')}
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
  contentList: {
    paddingBottom: 100,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  // Top App Bar
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 133, 246, 0.1)', // Primary opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800', // Extra bold
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  profileCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, // Darker shadow for dark mode
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.dark.primary, // Pop the avatar
    backgroundColor: Colors.dark.surface,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },

  // Credit Badge
  creditBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle contrast overlay
    padding: 12,
    borderRadius: 12,
  },
  creditLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  creditValueBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  creditValueText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Recent Analysis
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.primary,
  },

  // List Item Styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    gap: 12,
    // Add border for dark mode definition
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.dark.background,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8, // Slightly dim images to blend better
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e', // Green 500
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80', // Green 400 (Brighter for dark mode)
    textTransform: 'uppercase',
  },
  cardPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#94a3b8',
    marginBottom: 8,
  },
  linkText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
