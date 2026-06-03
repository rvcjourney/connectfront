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
import { LearnerMentorCard } from '../../components/LearnerMentorCard';
import { mentorApi } from '../../api/mentorApi';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;

function SectionHeaderRow({ title, count }) {
  return (
    <View style={styles.secHdrRow}>
      <Text style={styles.secHdrTitle}>{title}</Text>
      {count != null ? (
        <View style={styles.secHdrCount}>
          <Text style={styles.secHdrCountText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function StatSegment({ icon, iconColor, value, label }) {
  return (
    <View style={styles.statSeg}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
        {value}
      </Text>
      <View style={styles.statLabelRow}>
        <MaterialIcons name={icon} size={12} color={iconColor} />
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function BrowseMentorsScreen({ navigation }) {
  const [mentorsByCategory, setMentorsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      setLoading(true);
      const grouped = await mentorApi.getMentorsByCategory();
      setMentorsByCategory(grouped);
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

  const handleMentorPress = mentor => {
    navigation.navigate(SCREEN_NAMES.MentorProfile, {
      mentorId: mentor.id,
    });
  };

  const categories = Object.keys(mentorsByCategory).sort();
  const totalMentors = categories.reduce(
    (sum, c) => sum + mentorsByCategory[c].length,
    0,
  );
  const featuredCount = categories.filter(c => mentorsByCategory[c]?.length > 0).length;

  const renderCategorySection = (category, mentors) => (
    <View key={category} style={styles.section}>
      <SectionHeaderRow title={category} count={mentors.length} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mentorsRow}
      >
        {mentors.map(mentor => (
          <LearnerMentorCard
            key={mentor.id}
            mentor={mentor}
            onPress={handleMentorPress}
            showSessionCount
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
          tintColor={TEAL}
        />
      }
    >
      <View style={styles.hero}>
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
              <MaterialIcons name="travel-explore" size={28} color={PURPLE_LINK} />
            </View>
          </LinearGradient>
        </View>
        <Text style={styles.heroEyebrow}>Browse</Text>
        <Text style={styles.heroTitle}>Discover mentors</Text>
        <Text style={styles.heroSubtitle}>
          Explore experts by category. Open a profile to book a session.
        </Text>
        <View style={styles.heroChipRow}>
          <View style={styles.heroChip}>
            <MaterialIcons name="verified" size={13} color={TEAL} />
            <Text style={styles.heroChipText}>Verified profiles</Text>
          </View>
          <View style={[styles.heroChip, styles.heroChipAccent]}>
            <MaterialIcons name="bolt" size={13} color={GOLD} />
            <Text style={styles.heroChipText}>Quick booking</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsBar}>
        <StatSegment
          icon="category"
          iconColor="#e879f9"
          value={String(categories.length)}
          label="Categories"
        />
        <View style={styles.statDivider} />
        <StatSegment
          icon="groups"
          iconColor={PURPLE_LINK}
          value={String(totalMentors)}
          label="Mentors"
        />
        <View style={styles.statDivider} />
        <StatSegment
          icon="auto-awesome"
          iconColor={TEAL}
          value={String(featuredCount)}
          label="Active"
        />
      </View>

      {categories.length > 0 ? (
        <View style={styles.content}>
          {categories.map(category =>
            renderCategorySection(category, mentorsByCategory[category]),
          )}
        </View>
      ) : (
        !loading && (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconRing}>
              <MaterialIcons name="groups" size={36} color={PURPLE_LINK} />
            </View>
            <Text style={styles.emptyTitle}>No mentors available</Text>
            <Text style={styles.emptySubtitle}>Check back soon for new experts.</Text>
          </View>
        )
      )}

      <LoadingOverlay
        visible={loading || refreshing}
        message={refreshing ? 'Refreshing…' : 'Loading mentors…'}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 22,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.4,
    marginBottom: T.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 13,
    color: C.text.secondary,
    lineHeight: 20,
    marginBottom: T.spacing.md,
  },
  heroChipRow: {
    flexDirection: 'row',
    gap: T.spacing.xs,
    flexWrap: 'wrap',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: T.spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroChipAccent: {
    backgroundColor: S.accentGold,
    borderColor: 'rgba(240,216,117,0.25)',
  },
  heroChipText: {
    color: C.text.primary,
    fontSize: 10,
    fontWeight: '700',
  },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: T.spacing.lg,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
  },
  statSeg: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.4,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.text.muted,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginVertical: 6,
    alignSelf: 'stretch',
  },

  content: {
    flex: 1,
  },
  section: {
    marginBottom: T.spacing.sm,
  },
  secHdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: T.spacing.xs,
    marginBottom: 2,
  },
  secHdrTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text.primary,
    flex: 1,
    minWidth: 0,
  },
  secHdrCount: {
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
  secHdrCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: PURPLE_LINK,
  },
  mentorsRow: {
    gap: 10,
    paddingRight: T.spacing.lg,
    paddingTop: 6,
    paddingBottom: T.spacing.sm,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    marginBottom: T.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
