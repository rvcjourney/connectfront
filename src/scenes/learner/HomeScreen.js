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
import { MentorImageCard } from '../../components/MentorImageCard';
import { MentorDetailSheet } from '../../components/MentorDetailSheet';
import { mentorApi } from '../../api/mentorApi';
import { fetchActiveCategories } from '../../api/contentApi';
import { useAuth } from '../../hooks/useAuth';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const TB = T.colors.tabBar;

const CATEGORY_ICONS_FALLBACK = {
  technology:   'computer',
  programming:  'code',
  software:     'code',
  design:       'palette',
  business:     'business-center',
  marketing:    'campaign',
  finance:      'account-balance',
  data:         'bar-chart',
  science:      'biotech',
  language:     'translate',
  music:        'music-note',
  art:          'brush',
  photography:  'camera-alt',
  fitness:      'fitness-center',
  health:       'favorite',
  law:          'gavel',
  legal:        'gavel',
  education:    'school',
  leadership:   'groups',
  writing:      'edit-note',
  career:       'work',
  cloud:        'cloud',
  security:     'security',
  sales:        'point-of-sale',
  others:       'auto-awesome',
};

function normalizeMaterialIcon(icon = '') {
  // MaterialIcons expects lowercase with hyphens: "account_balance" → "account-balance"
  return icon.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
}

function getCategoryIcon(category = '', dbIconMap = {}) {
  const name = category.toLowerCase().trim();
  if (dbIconMap[name]) return normalizeMaterialIcon(dbIconMap[name]);
  for (const [k, v] of Object.entries(CATEGORY_ICONS_FALLBACK)) {
    if (name.includes(k)) return v;
  }
  return 'auto-awesome';
}

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
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });
  return <Animated.View style={[sk.bone, style, { opacity }]} />;
}

function SkeletonImageCard() {
  return <SkeletonBone style={sk.imageCard} />;
}

function SkeletonCategoryRow() {
  return (
    <View style={sk.section}>
      {/* section header placeholder */}
      <View style={sk.headerRow}>
        <SkeletonBone style={sk.iconBox} />
        <SkeletonBone style={sk.sectionTitle} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sk.row}>
        {[0, 1, 2, 3].map(i => <SkeletonImageCard key={i} />)}
      </ScrollView>
    </View>
  );
}

function HomeScreenSkeleton() {
  return (
    <>
      <SkeletonCategoryRow />
      <SkeletonCategoryRow />
    </>
  );
}

const sk = StyleSheet.create({
  bone: { backgroundColor: T.colors.border.default, borderRadius: T.borderRadius.lg },
  imageCard: {
    width: 120,
    height: 172,
    borderRadius: T.borderRadius.lg,
  },
  section: { marginBottom: T.spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    marginBottom: T.spacing.md,
  },
  iconBox: { width: 26, height: 26, borderRadius: 7 },
  sectionTitle: { height: 14, width: 110, borderRadius: T.borderRadius.sm },
  row: { gap: T.spacing.sm, paddingBottom: T.spacing.sm },
});

export default function LearnerHomeScreen({ navigation }) {
  const { profile } = useAuth();
  const [mentorsByCategory, setMentorsByCategory] = useState({});
  const [categoryIconMap, setCategoryIconMap] = useState({});
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const searchDebounce = useRef(null);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      setLoading(true);
      const [grouped, dbCategories] = await Promise.all([
        mentorApi.getMentorsByCategory(),
        fetchActiveCategories(),
      ]);
      const iconMap = {};
      (dbCategories || []).forEach(c => {
        if (c.name && c.icon) iconMap[c.name.toLowerCase().trim()] = c.icon;
      });
      setCategoryIconMap(iconMap);
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
        const results = await mentorApi.searchMentors(text.replace(/^@/, ''));
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

  const renderCategorySection = (category, mentors, isSearch = false) => (
    <View key={category} style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.categoryLabel}>
          <View style={styles.categoryIconBox}>
            <MaterialIcons
              name={getCategoryIcon(category, categoryIconMap)}
              size={14}
              color={T.colors.accent.secondary}
            />
          </View>
          <Text style={styles.categoryTitle}>{category}</Text>
          {!isSearch && (
            <View style={styles.countPill}>
              <Text style={styles.countPillTxt}>{mentors.length}</Text>
            </View>
          )}
        </View>
        {!isSearch && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation.navigate(SCREEN_NAMES.CategoryMentors, { category })}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllTxt}>See all</Text>
            <MaterialIcons name="chevron-right" size={13} color={T.colors.accent.secondary} />
          </TouchableOpacity>
        )}
        {isSearch && (
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeTxt}>{mentors.length} found</Text>
          </View>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mentorsRow}
      >
        {mentors.map(mentor => (
          <MentorImageCard
            key={mentor.id}
            mentor={mentor}
            onPress={setSelectedMentor}
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


      <View style={styles.searchWrap}>
        <View style={styles.searchLabelRow}>
          <MaterialIcons name="explore" size={15} color={T.colors.accent.secondary} />
          <Text style={styles.searchLabel}>
            {isSearching
              ? 'Search results'
              : `${filteredCategories.length} topics · ${totalMentors} mentors`}
          </Text>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search by name, @username or skill…"
          containerStyle={styles.searchBarInner}
        />
      </View>

      {loading ? (
        <HomeScreenSkeleton />
      ) : isSearching ? (
        searchLoading ? (
          <HomeScreenSkeleton />
        ) : searchResults && searchResults.length > 0 ? (
          <View style={styles.content}>
            {renderCategorySection('Search Results', searchResults, true)}
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

      <MentorDetailSheet
        mentor={selectedMentor}
        visible={selectedMentor !== null}
        onClose={() => setSelectedMentor(null)}
        onBook={mentor => {
          setSelectedMentor(null);
          handleBookMentor(mentor);
        }}
        onViewProfile={mentor => {
          setSelectedMentor(null);
          handleViewProfile(mentor);
        }}
      />
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
  searchWrap: {
    marginBottom: T.spacing.lg,
  },
  searchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.xs,
    marginBottom: T.spacing.sm,
    paddingHorizontal: 2,
  },
  searchLabel: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  searchBarInner: {
    marginBottom: 0,
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
    marginBottom: T.spacing.md,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    flex: 1,
  },
  categoryIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    fontWeight: '700',
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  countPillTxt: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    fontWeight: '600',
    fontSize: 11,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingLeft: T.spacing.sm,
  },
  seeAllTxt: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    fontWeight: '600',
  },
  resultBadge: {
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 3,
    borderRadius: T.borderRadius.sm,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
  },
  resultBadgeTxt: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    fontWeight: '700',
    fontSize: 11,
  },

  mentorsRow: {
    paddingLeft: 2,
    paddingRight: T.spacing.lg,
    paddingBottom: T.spacing.sm,
    gap: T.spacing.sm,
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
