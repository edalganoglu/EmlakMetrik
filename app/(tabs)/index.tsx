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
          <Image
            source={require('@/assets/images/logo-vertical.png')}
            style={{ width: 140, height: 40 }}
            resizeMode="contain"
          />
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
        <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProperty = ({ item }: { item: any }) => {
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

    // Icon background style based on status
    let iconBg = styles.iconBgBlue;
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
      <TouchableOpacity
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
            <Text style={styles.cardPrice}>{priceFormatted}</Text>
          </View>

          <View style={[styles.rowBetween, { alignItems: 'flex-end', marginTop: 4 }]}>
            <View>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.location || 'Konum Belirtilmemiş'} • {item.tag || 'Analiz'}
              </Text>
              <Text style={styles.cardDate}>{dateStr}</Text>
            </View>

            {/* Badges: YENİ veya PDF */}
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
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={properties.slice(0, 4)}
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
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
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
    fontFamily: 'Manrope_500Medium',
    color: '#94a3b8',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
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
    fontFamily: 'Manrope_600SemiBold',
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
    fontFamily: 'Manrope_700Bold',
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
    fontFamily: 'Manrope_700Bold',
    color: Colors.dark.text,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: Colors.dark.primary,
  },

  // List Item Styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
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
  cardPrice: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: '#4ade80', // green 400
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
    fontFamily: 'Manrope_700Bold',
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

