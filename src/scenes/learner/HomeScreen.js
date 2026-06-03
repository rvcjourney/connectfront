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
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;

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
  bone: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: T.borderRadius.lg },
  imageCard: {
    width: 120,
    height: 172,
    borderRadius: 16,
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
              color={PURPLE_LINK}
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAllTxt}>See all &gt;</Text>
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
          tintColor={TEAL}
        />
      }
    >
      <View style={styles.discoverHero}>
        <LinearGradient
          colors={S.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroIconRing}>
          <LinearGradient
            colors={B.premiumGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroIconRingGrad}
          >
            <View style={styles.heroIconInner}>
              <MaterialIcons name="travel-explore" size={24} color={PURPLE_LINK} />
            </View>
          </LinearGradient>
        </View>
        <Text style={styles.heroEyebrow}>Discover</Text>
        <Text style={styles.heroTitle}>Find your mentor</Text>
        <Text style={styles.heroSubtitle}>
          Search by name or browse experts by category.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchLabelRow}>
          <MaterialIcons name="explore" size={15} color={PURPLE_LINK} />
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
            <View style={styles.emptyIconRing}>
              <MaterialIcons name="travel-explore" size={30} color={PURPLE_LINK} />
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
          <View style={styles.emptyIconRing}>
            <MaterialIcons name="travel-explore" size={30} color={PURPLE_LINK} />
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
  discoverHero: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'flex-start',
    ...Platform.select({ ios: T.shadows.medium, android: { elevation: 6 } }),
  },
  heroIconRing: {
    marginBottom: T.spacing.sm,
  },
  heroIconRingGrad: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroIconInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary.void,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE_LINK,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.4,
    marginBottom: T.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 13,
    color: C.text.secondary,
    lineHeight: 20,
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
    fontSize: 12,
    color: C.text.muted,
    fontWeight: '600',
    letterSpacing: 0.2,
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
    marginTop: T.spacing.xs,
    marginBottom: 2,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  categoryIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    color: C.text.primary,
    fontWeight: '800',
    flexShrink: 1,
  },
  countPill: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countPillTxt: {
    fontSize: 11,
    color: PURPLE_LINK,
    fontWeight: '800',
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingLeft: T.spacing.sm,
  },
  seeAllTxt: {
    fontSize: 13,
    color: PURPLE_LINK,
    fontWeight: '700',
  },
  resultBadge: {
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: S.accentTeal,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.25)',
  },
  resultBadgeTxt: {
    fontSize: 11,
    color: TEAL,
    fontWeight: '700',
  },

  mentorsRow: {
    paddingRight: T.spacing.lg,
    paddingTop: 6,
    paddingBottom: T.spacing.sm,
    gap: 10,
  },
  emptyPanel: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.lg,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text.primary,
    textAlign: 'center',
    marginBottom: T.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
