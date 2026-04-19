import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import CosmicBackground from '../../components/CosmicBackground';
import { LearnerMentorCard } from '../../components/LearnerMentorCard';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { mentorApi } from '../../api/mentorApi';
import { useAuth } from '../../hooks/useAuth';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { key: 'rating',      label: 'Top Rated',   icon: 'star' },
  { key: 'price_asc',   label: 'Price: Low',  icon: 'arrow-upward' },
  { key: 'price_desc',  label: 'Price: High', icon: 'arrow-downward' },
  { key: 'experience',  label: 'Experience',  icon: 'workspace-premium' },
];

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
  const [mentors, setMentors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('rating');

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
          colors={['rgba(94,234,212,0.12)', 'rgba(167,139,250,0.10)', 'rgba(2,0,20,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerTop}>
          <View style={styles.categoryBadge}>
            <MaterialIcons name="category" size={14} color={T.colors.accent.secondary} />
            <Text style={styles.categoryBadgeTxt}>Category</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>{category}</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <MaterialIcons name="people" size={15} color={T.colors.accent.secondary} />
            <Text style={styles.headerStatTxt}>
              {totalCount}{hasMore ? '+' : ''} mentor{totalCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerStatDot} />
          <View style={styles.headerStat}>
            <MaterialIcons name="sort" size={15} color={T.colors.text.muted} />
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
                color={active ? T.colors.primary.dark : T.colors.text.muted}
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
          <ActivityIndicator size="small" color={T.colors.accent.secondary} />
        ) : (
          <>
            <MaterialIcons name="expand-more" size={20} color={T.colors.accent.secondary} />
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
          !loading ? (
            <View style={styles.empty}>
              <MaterialIcons name="person-search" size={36} color={T.colors.text.muted} />
              <Text style={styles.emptyTxt}>No mentors in this category</Text>
            </View>
          ) : null
        }
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <LearnerMentorCard
              mentor={item}
              onBook={handleBookMentor}
              onViewProfile={handleViewProfile}
              fullWidth
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.colors.accent.secondary}
          />
        }
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
    borderBottomColor: T.colors.border.light,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: T.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    padding: T.spacing.lg,
    paddingBottom: T.spacing.xxxl,
  },
  headerCard: {
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
    backgroundColor: T.colors.primary.dark,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 3 },
    }),
  },
  headerTop: {
    marginBottom: T.spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 4,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  categoryBadgeTxt: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    fontWeight: '800',
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
    ...T.typography.bodySm,
    color: T.colors.accent.secondary,
    fontWeight: '600',
  },
  headerStatMuted: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
  },
  headerStatDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.colors.border.default,
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
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
  },
  sortChipActive: {
    backgroundColor: T.colors.accent.secondary,
    borderColor: T.colors.accent.secondary,
  },
  sortChipTxt: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    fontWeight: '600',
  },
  sortChipTxtActive: {
    color: T.colors.primary.dark,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: T.spacing.md,
  },
  cardWrap: {
    width: '48%',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    marginTop: T.spacing.sm,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
  },
  loadMoreTxt: {
    ...T.typography.bodySm,
    color: T.colors.accent.secondary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    gap: T.spacing.md,
  },
  emptyTxt: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
  },
});
