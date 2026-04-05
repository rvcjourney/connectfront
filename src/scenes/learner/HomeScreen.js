import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { SearchBar } from '../../components/SearchBar';
import { SectionHeader } from '../../components/SectionHeader';
import { LearnerMentorCard } from '../../components/LearnerMentorCard';
import { mentorApi } from '../../api/mentorApi';
import { useAuth } from '../../hooks/useAuth';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const TB = T.colors.tabBar;

export default function LearnerHomeScreen({ navigation }) {
  const { profile } = useAuth();
  const [mentorsByCategory, setMentorsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (error) {
      console.error('Error loading mentors:', error);
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

  const getFilteredMentors = () => {
    if (!searchQuery.trim()) {
      return mentorsByCategory;
    }

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(mentorsByCategory).forEach(([category, mentors]) => {
      const filteredMentors = mentors.filter(mentor => {
        const name = mentor.profiles?.name?.toLowerCase() || '';
        const specialization = mentor.specialization?.toLowerCase() || '';
        const cat = category.toLowerCase();

        return (
          name.includes(query) ||
          specialization.includes(query) ||
          cat.includes(query)
        );
      });

      if (filteredMentors.length > 0) {
        filtered[category] = filteredMentors;
      }
    });

    return filtered;
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

  const filteredMentors = getFilteredMentors();
  const filteredCategories = Object.keys(filteredMentors).sort();
  const totalMentors = filteredCategories.reduce(
    (sum, c) => sum + filteredMentors[c].length,
    0,
  );

  const renderCategorySection = (category, mentors) => (
    <View key={category} style={styles.section}>
      <View style={styles.sectionBar}>
        <SectionHeader
          title={category}
          subtitle="Swipe for more mentors in this topic"
          count={mentors.length}
        />
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
      hasBottomTabs={true}
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
        onChangeText={setSearchQuery}
        placeholder="Search by name, skill, or category…"
      />

      {filteredCategories.length > 0 ? (
        <View style={styles.content}>
          {filteredCategories.map(category =>
            renderCategorySection(category, filteredMentors[category]),
          )}
        </View>
      ) : (
        !loading && (
          <View style={styles.emptyPanel}>
            <View style={styles.emptyIconTile}>
              <MaterialIcons name="travel-explore" size={30} color={T.colors.accent.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No mentors match your search</Text>
            <Text style={styles.emptySubtitle}>
              Try another keyword or clear the search to browse all categories.
            </Text>
          </View>
        )
      )}

      <LoadingOverlay
        visible={loading && !refreshing}
        message={refreshing ? 'Refreshing…' : 'Loading mentors…'}
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
  content: {
    flex: 1,
    paddingBottom: T.spacing.xl,
  },
  section: {
    marginBottom: T.spacing.xxl,
  },
  sectionBar: {
    borderLeftWidth: 3,
    borderLeftColor: T.colors.border.default,
    paddingLeft: T.spacing.sm,
    marginBottom: T.spacing.xs,
  },
  mentorsRow: {
    paddingRight: T.spacing.lg,
    paddingBottom: T.spacing.xs,
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
