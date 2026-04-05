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
import { SectionHeader } from '../../components/SectionHeader';
import { LearnerMentorCard } from '../../components/LearnerMentorCard';
import { mentorApi } from '../../api/mentorApi';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;

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

  const renderCategorySection = (category, mentors) => (
    <View key={category} style={styles.section}>
      <SectionHeader title={category} subtitle="Tap a card to view full profile" count={mentors.length} />
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
          tintColor={T.colors.accent.secondary}
        />
      }
    >
      <View style={styles.hero}>
        <LinearGradient
          colors={[
            'rgba(167, 139, 250, 0.2)',
            'rgba(94, 234, 212, 0.1)',
            'rgba(2, 0, 20, 0.45)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroRim} pointerEvents="none" />
        <Text style={styles.heroTitle}>Discover mentors</Text>
        <Text style={styles.heroSubtitle}>
          Explore experts by category. Open a profile to book a session.
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{categories.length}</Text>
            <Text style={styles.heroStatLabel}>Categories</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{totalMentors}</Text>
            <Text style={styles.heroStatLabel}>Mentors</Text>
          </View>
        </View>
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
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="groups" size={36} color={T.colors.accent.secondary} />
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
    borderRadius: T.borderRadius.xl,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.primary.dark,
    ...Platform.select({
      ios: T.shadows.medium,
      android: { elevation: 6 },
    }),
  },
  heroRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: T.borderRadius.xl,
    borderWidth: 1,
    borderColor: T.colors.tabBar.rimBorder,
    margin: 1,
  },
  heroTitle: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    marginBottom: T.spacing.sm,
  },
  heroSubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    lineHeight: 22,
    marginBottom: T.spacing.lg,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 0, 20, 0.45)',
    borderRadius: T.borderRadius.lg,
    paddingVertical: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: T.colors.border.light,
    opacity: 0.6,
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
  mentorsRow: {
    paddingRight: T.spacing.lg,
    paddingBottom: T.spacing.xs,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: T.colors.component.card,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.lg,
  },
  emptyTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    marginBottom: T.spacing.sm,
  },
  emptySubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    textAlign: 'center',
  },
});
