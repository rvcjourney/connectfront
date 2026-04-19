import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { SearchBar } from '../../components/SearchBar';
import { SectionHeader } from '../../components/SectionHeader';
import { LearnerMentorCard } from '../../components/LearnerMentorCard';
import { mentorApi } from '../../api/mentorApi';
import { useAuth } from '../../hooks/useAuth';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const TB = T.colors.tabBar;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonBone({ style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });
  return <Animated.View style={[sk.bone, style, { opacity }]} />;
}

function SkeletonMentorCard() {
  return (
    <View style={sk.card}>
      <View style={sk.topRow}>
        <SkeletonBone style={sk.avatar} />
        <View style={sk.headCol}>
          <SkeletonBone style={sk.nameLine} />
          <SkeletonBone style={sk.ratingLine} />
        </View>
      </View>
      <SkeletonBone style={sk.specLine} />
      <SkeletonBone style={sk.specShort} />
      <SkeletonBone style={sk.priceLine} />
      <SkeletonBone style={sk.btnLine} />
    </View>
  );
}

function SkeletonCategoryRow() {
  return (
    <View style={sk.section}>
      <SkeletonBone style={sk.sectionTitle} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sk.row}>
        {[0, 1, 2].map(i => <SkeletonMentorCard key={i} />)}
      </ScrollView>
    </View>
  );
}

function HomeScreenSkeleton() {
  return (
    <>
      {/* hero placeholder */}
      <View style={sk.hero}>
        <SkeletonBone style={sk.heroBadge} />
        <SkeletonBone style={sk.heroTitle} />
        <SkeletonBone style={sk.heroSubtitle} />
        <View style={sk.heroStatsRow}>
          <SkeletonBone style={sk.heroStat} />
          <SkeletonBone style={sk.heroStat} />
        </View>
      </View>
      {/* search bar placeholder */}
      <SkeletonBone style={sk.searchBar} />
      {/* 2 category rows */}
      <SkeletonCategoryRow />
      <SkeletonCategoryRow />
    </>
  );
}

const sk = StyleSheet.create({
  bone: { backgroundColor: T.colors.border.default, borderRadius: T.borderRadius.sm },
  hero: {
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.card,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
    gap: T.spacing.sm,
  },
  heroBadge: { height: 26, width: 90, borderRadius: T.borderRadius.sm },
  heroTitle: { height: 20, width: '60%' },
  heroSubtitle: { height: 14, width: '85%' },
  heroStatsRow: { flexDirection: 'row', gap: T.spacing.md, marginTop: T.spacing.xs },
  heroStat: { height: 36, flex: 1, borderRadius: T.borderRadius.sm },
  searchBar: { height: 44, width: '100%', marginBottom: T.spacing.lg },
  section: { marginBottom: T.spacing.xxl },
  sectionTitle: { height: 16, width: 120, marginBottom: T.spacing.md },
  row: { gap: T.spacing.sm, paddingBottom: T.spacing.sm },
  card: {
    width: 176,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.sm,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    gap: T.spacing.sm,
  },
  topRow: { flexDirection: 'row', gap: T.spacing.sm, marginBottom: T.spacing.xs },
  headCol: { flex: 1, gap: 6, justifyContent: 'center' },
  avatar: { width: 48, height: 48, borderRadius: T.borderRadius.sm },
  nameLine: { height: 12, width: '80%' },
  ratingLine: { height: 10, width: '50%' },
  specLine: { height: 10, width: '100%' },
  specShort: { height: 10, width: '65%' },
  priceLine: { height: 14, width: '45%' },
  btnLine: { height: 32, width: '100%', borderRadius: T.borderRadius.sm },
});

export default function LearnerHomeScreen({ navigation }) {
  const { profile } = useAuth();
  const [mentorsByCategory, setMentorsByCategory] = useState({});
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounce = useRef(null);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      setLoading(true);
      const grouped = await mentorApi.getMentorsByCategory();
      const filtered = {};
      Object.entries(grouped).forEach(([category, mentors]) => {
        const withoutSelf = mentors.filter(m => m.id !== profile?.id);
        if (withoutSelf.length > 0) filtered[category] = withoutSelf;
      });
      setMentorsByCategory(filtered);
    } catch {
      Toast.show('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMentors();
    setRefreshing(false);
  };

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (!text.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await mentorApi.searchMentors(text);
        const withoutSelf = results.filter(m => m.id !== profile?.id);
        setSearchResults(withoutSelf);
      } catch {
        Toast.show('Search failed');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [profile?.id]);

  const getFilteredMentors = () => {
    if (searchResults !== null) return null; // using flat search results instead
    return mentorsByCategory;
  };

  const handleBookMentor = mentor => {
    navigation.navigate('Booking_Screen', {
      mentorId: mentor.id,
      mentorName: mentor.profiles?.name || 'Mentor',
    });
  };

  const handleViewProfile = mentor => {
    navigation.navigate(SCREEN_NAMES.MentorProfile, { mentorId: mentor.id });
  };

  const isSearching = searchQuery.trim().length > 0;
  const groupedMentors = getFilteredMentors();
  const filteredCategories = groupedMentors ? Object.keys(groupedMentors).sort() : [];
  const totalMentors = isSearching
    ? (searchResults?.length ?? 0)
    : filteredCategories.reduce((sum, c) => sum + groupedMentors[c].length, 0);

  const renderCategorySection = (category, mentors) => (
    <View key={category} style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderFlex}>
          <SectionHeader title={category} />
        </View>
        <TouchableOpacity
          style={styles.seeAllBtn}
          onPress={() => navigation.navigate(SCREEN_NAMES.CategoryMentors, { category })}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllTxt}>See all</Text>
          <MaterialIcons name="chevron-right" size={14} color={T.colors.primary.dark} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mentorsRow}
      >
        {mentors.map(mentor => (
          <LearnerMentorCard
            key={mentor.id}
            mentor={mentor}
            onBook={handleBookMentor}
            onViewProfile={handleViewProfile}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeScreen
      scrollable={true}
      padding={T.spacing.lg}
      hasBottomTabs={false}
      includeTopInset={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={T.colors.accent.secondary}
        />
      }
    >
      <View style={styles.hero}>
        <LinearGradient
          colors={TB.flatBarEdge}
          locations={[0, 0.4, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroBeam}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[
            'rgba(167, 139, 250, 0.14)',
            'rgba(94, 234, 212, 0.1)',
            'rgba(2, 0, 20, 0.68)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <MaterialIcons name="explore" size={16} color={T.colors.accent.secondary} />
            <Text style={styles.heroBadgeText}>Discover</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Find your mentor</Text>
        <Text style={styles.heroSubtitle}>
          Search by name or skill, then book a session in a few taps.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{filteredCategories.length}</Text>
            <Text style={styles.heroStatLabel}>Topics</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{totalMentors}</Text>
            <Text style={styles.heroStatLabel}>Mentors</Text>
          </View>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder="Search by name, skill, or category…"
      />

      {loading ? (
        <HomeScreenSkeleton />
      ) : isSearching ? (
        searchLoading ? (
          <HomeScreenSkeleton />
        ) : searchResults && searchResults.length > 0 ? (
          <View style={styles.content}>
            {renderCategorySection('Search Results', searchResults)}
          </View>
        ) : (
          <View style={styles.emptyPanel}>
            <View style={styles.emptyIconTile}>
              <MaterialIcons name="travel-explore" size={30} color={T.colors.accent.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No mentors found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different keyword or clear the search to browse all categories.
            </Text>
          </View>
        )
      ) : filteredCategories.length > 0 ? (
        <View style={styles.content}>
          {filteredCategories.map(category =>
            renderCategorySection(category, groupedMentors[category]),
          )}
        </View>
      ) : (
        <View style={styles.emptyPanel}>
          <View style={styles.emptyIconTile}>
            <MaterialIcons name="travel-explore" size={30} color={T.colors.accent.secondary} />
          </View>
          <Text style={styles.emptyTitle}>No mentors available</Text>
          <Text style={styles.emptySubtitle}>
            Pull down to refresh or check back later.
          </Text>
        </View>
      )}

    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
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
      android: { elevation: 4 },
    }),
  },
  heroBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.9,
    zIndex: 1,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: T.spacing.md,
    zIndex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: T.spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  heroBadgeText: {
    ...T.typography.labelSm,
    color: T.colors.text.secondary,
    fontWeight: '700',
  },
  heroTitle: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.sm,
    zIndex: 1,
  },
  heroSubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    lineHeight: 22,
    marginBottom: T.spacing.lg,
    zIndex: 1,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: T.colors.border.light,
    paddingTop: T.spacing.md,
    marginTop: -T.spacing.xs,
    zIndex: 1,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: T.colors.border.light,
    opacity: 0.7,
  },
  heroStatValue: {
    ...T.typography.headingSm,
    color: T.colors.accent.primary,
    fontWeight: '800',
  },
  heroStatLabel: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  section: {
    marginBottom: T.spacing.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderFlex: {
    flex: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: T.spacing.sm,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.accent.secondary,
    marginLeft: T.spacing.sm,
  },
  seeAllTxt: {
    ...T.typography.labelSm,
    color: T.colors.primary.dark,
    fontWeight: '700',
  },

  mentorsRow: {
    paddingLeft: 2,
    paddingRight: T.spacing.lg,
    paddingBottom: T.spacing.sm,
  },
  emptyPanel: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.card,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
  },
  emptyIconTile: {
    width: 64,
    height: 64,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.lg,
  },
  emptyTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    textAlign: 'center',
    marginBottom: T.spacing.sm,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
