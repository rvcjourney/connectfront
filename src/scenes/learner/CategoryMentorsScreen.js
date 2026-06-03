import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import CosmicBackground from '../../components/CosmicBackground';
import { MentorImageCard } from '../../components/MentorImageCard';
import { MentorDetailSheet } from '../../components/MentorDetailSheet';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { mentorApi } from '../../api/mentorApi';
import { useAuth } from '../../hooks/useAuth';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { key: 'rating',      label: 'Top Rated',   icon: 'star' },
  { key: 'price_asc',   label: 'Price: Low',  icon: 'arrow-upward' },
  { key: 'price_desc',  label: 'Price: High', icon: 'arrow-downward' },
  { key: 'experience',  label: 'Experience',  icon: 'workspace-premium' },
];

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return anim;
}

function SkeletonBone({ style }) {
  const opacity = useShimmer();
  return (
    <Animated.View style={[skeletonStyles.bone, style, { opacity: opacity.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] }) }]} />
  );
}

function SkeletonCard({ cardWidth, cardHeight }) {
  return (
    <SkeletonBone style={[skeletonStyles.card, { width: cardWidth, height: cardHeight }]} />
  );
}

function SkeletonGrid({ cardWidth, cardHeight }) {
  return (
    <View style={skeletonStyles.grid}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <SkeletonCard key={i} cardWidth={cardWidth} cardHeight={cardHeight} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.md,
  },
  card: {
    borderRadius: 16,
  },
  bone: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
});

// ─── Sort ─────────────────────────────────────────────────────────────────────
function applySortFn(arr, sortBy) {
  const copy = [...arr];
  switch (sortBy) {
    case 'price_asc':
      return copy.sort((a, b) => (a.price_per_hour ?? 0) - (b.price_per_hour ?? 0));
    case 'price_desc':
      return copy.sort((a, b) => (b.price_per_hour ?? 0) - (a.price_per_hour ?? 0));
    case 'experience':
      return copy.sort((a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0));
    case 'rating':
    default:
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export default function CategoryMentorsScreen({ route, navigation }) {
  const { category } = route.params;
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [mentors, setMentors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('rating');
  const [selectedMentor, setSelectedMentor] = useState(null);

  const CARD_GAP    = T.spacing.md;
  const H_PADDING   = T.spacing.lg * 2;
  const cardWidth   = Math.floor((screenWidth - H_PADDING - CARD_GAP) / 2);
  const cardHeight  = Math.floor(cardWidth * 1.45);

  useEffect(() => {
    loadInitial();
  }, [category]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      setPage(0);
      setHasMore(true);
      const data = await mentorApi.getMentorsByCategoryName(category, 0, PAGE_SIZE);
      const filtered = (data || []).filter(m => m.id !== profile?.id);
      setMentors(filtered);
      setTotalCount(filtered.length);
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      Toast.show('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const data = await mentorApi.getMentorsByCategoryName(category, page, PAGE_SIZE);
      const filtered = (data || []).filter(m => m.id !== profile?.id);
      const next = [...mentors, ...filtered];
      setMentors(next);
      setTotalCount(next.length);
      setPage(p => p + 1);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      Toast.show('Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, category, profile?.id, mentors]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  const handleBookMentor = mentor => {
    navigation.navigate(SCREEN_NAMES.Booking, {
      mentorId: mentor.id,
      mentorName: mentor.profiles?.name || 'Mentor',
    });
  };

  const handleViewProfile = mentor => {
    navigation.navigate(SCREEN_NAMES.MentorProfile, { mentorId: mentor.id });
  };

  const sortedMentors = useMemo(() => applySortFn(mentors, sortBy), [mentors, sortBy]);

  const activeSortLabel = SORT_OPTIONS.find(s => s.key === sortBy)?.label || 'Top Rated';

  const ListHeader = (
    <>
      {/* ── Header card ── */}
      <View style={styles.headerCard}>
        <LinearGradient
          colors={S.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.categoryBadge}>
          <MaterialIcons name="category" size={14} color={PURPLE_LINK} />
          <Text style={styles.categoryBadgeTxt}>Category</Text>
        </View>
        <Text style={styles.headerTitle}>{category}</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <MaterialIcons name="people" size={15} color={TEAL} />
            <Text style={styles.headerStatTxt}>
              {totalCount}{hasMore ? '+' : ''} mentor{totalCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerStatDot} />
          <View style={styles.headerStat}>
            <MaterialIcons name="sort" size={15} color={PURPLE_LINK} />
            <Text style={styles.headerStatMuted}>{activeSortLabel}</Text>
          </View>
        </View>
      </View>

      {/* ── Sort bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortBar}
      >
        {SORT_OPTIONS.map(opt => {
          const active = sortBy === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => setSortBy(opt.key)}
              activeOpacity={0.75}
            >
              <MaterialIcons
                name={opt.icon}
                size={14}
                color={active ? B.nebulaText : C.text.muted}
              />
              <Text style={[styles.sortChipTxt, active && styles.sortChipTxtActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.7}>
        {loadingMore ? (
          <ActivityIndicator size="small" color={TEAL} />
        ) : (
          <>
            <MaterialIcons name="expand-more" size={20} color={PURPLE_LINK} />
            <Text style={styles.loadMoreTxt}>Load more</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CosmicBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        {/* ── Top bar ── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>Mentor Category</Text>
          <View style={styles.backBtn} />
        </View>

        {loading ? (
          <SkeletonGrid cardWidth={cardWidth} cardHeight={cardHeight} />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={sortedMentors}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name="person-search" size={36} color={PURPLE_LINK} />
                <Text style={styles.emptyTxt}>No mentors in this category</Text>
              </View>
            }
            ListFooterComponent={renderFooter}
            renderItem={({ item }) => (
              <MentorImageCard
                mentor={item}
                onPress={setSelectedMentor}
                style={{ width: cardWidth, height: cardHeight }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={TEAL}
              />
            }
          />
        )}

        <MentorDetailSheet
          mentor={selectedMentor}
          visible={selectedMentor !== null}
          onClose={() => setSelectedMentor(null)}
          onBook={mentor => { setSelectedMentor(null); handleBookMentor(mentor); }}
          onViewProfile={mentor => { setSelectedMentor(null); handleViewProfile(mentor); }}
        />
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.md,
    paddingBottom: T.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167,139,250,0.22)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12,12,40,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  topBarTitle: {
    fontSize: 15,
    color: C.text.primary,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    padding: T.spacing.lg,
    paddingBottom: T.spacing.xxxl,
  },
  headerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    ...Platform.select({ ios: T.shadows.medium, android: { elevation: 6 } }),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    marginBottom: T.spacing.sm,
  },
  categoryBadgeTxt: {
    fontSize: 10,
    color: PURPLE_LINK,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    color: C.text.primary,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: T.spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerStatTxt: {
    fontSize: 13,
    color: TEAL,
    fontWeight: '600',
  },
  headerStatMuted: {
    fontSize: 13,
    color: C.text.muted,
  },
  headerStatDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  sortBar: {
    gap: T.spacing.sm,
    paddingBottom: T.spacing.md,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sortChipActive: {
    backgroundColor: S.accentViolet,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  sortChipTxt: {
    fontSize: 12,
    color: C.text.muted,
    fontWeight: '600',
  },
  sortChipTxtActive: {
    color: PURPLE_LINK,
    fontWeight: '800',
  },
  row: {
    gap: T.spacing.md,
    marginBottom: T.spacing.md,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    marginTop: T.spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  loadMoreTxt: {
    fontSize: 13,
    color: PURPLE_LINK,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    gap: T.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  emptyTxt: {
    fontSize: 14,
    color: C.text.muted,
    fontWeight: '600',
  },
});
