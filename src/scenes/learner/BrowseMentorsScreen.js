import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { mentorApi } from '../../api/mentorApi';

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

  const handleMentorPress = (mentor) => {
    navigation.navigate('MentorProfile', {
      mentorId: mentor.id,
      mentorName: mentor.profiles?.name || 'Mentor',
    });
  };

  const renderMentorCard = (mentor) => (
    <TouchableOpacity
      key={mentor.id}
      style={styles.mentorCard}
      onPress={() => handleMentorPress(mentor)}
    >
      {/* Avatar */}
      {mentor.profiles?.avatar_url ? (
        <Image source={{ uri: mentor.profiles.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {mentor.profiles?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      )}

      {/* Rating */}
      <View style={styles.ratingBadge}>
        <Text style={styles.ratingText}>⭐ {mentor.rating || 'N/A'}</Text>
      </View>

      {/* Info */}
      <Text style={styles.mentorName} numberOfLines={1}>
        {mentor.profiles?.name || 'Unknown'}
      </Text>
      <Text style={styles.mentorSpecialization} numberOfLines={2}>
        {mentor.specialization || 'Specialist'}
      </Text>
      <Text style={styles.mentorPrice}>
        ₹{mentor.price_per_hour || '0'}/hr
      </Text>

      {/* Sessions */}
      <Text style={styles.mentorSessions}>
        {mentor.total_sessions || 0} sessions
      </Text>
    </TouchableOpacity>
  );

  const renderCategorySection = (category, mentors) => (
    <View key={category} style={styles.section}>
      <Text style={styles.categoryTitle}>✨ {category}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.mentorsList}
      >
        {mentors.map(mentor => renderMentorCard(mentor))}
      </ScrollView>
    </View>
  );

  const categories = Object.keys(mentorsByCategory).sort();

  return (
    <SafeScreen
      scrollable={true}
      padding={UNIFIED_THEME.spacing.lg}
      hasBottomTabs={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={UNIFIED_THEME.colors.primary.light}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Discover Mentors</Text>
        <Text style={styles.subtitle}>Find mentors by expertise</Text>
      </View>

      {categories.length > 0 ? (
        <View style={styles.content}>
          {categories.map(category =>
            renderCategorySection(category, mentorsByCategory[category])
          )}
        </View>
      ) : (
        !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Mentors Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon for amazing mentors
            </Text>
          </View>
        )
      )}

      <LoadingOverlay
        visible={loading || refreshing}
        message={refreshing ? 'Refreshing...' : 'Loading mentors...'}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },
  title: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  subtitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: UNIFIED_THEME.spacing.xxl,
  },
  categoryTitle: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  mentorsList: {
    paddingHorizontal: 0,
  },
  mentorCard: {
    width: 150,
    marginRight: UNIFIED_THEME.spacing.md,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    padding: UNIFIED_THEME.spacing.md,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: UNIFIED_THEME.spacing.md,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.primary.light,
    fontWeight: 'bold',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: 8,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: 2,
  },
  ratingText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: '#FFF',
    fontWeight: '600',
  },
  mentorName: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  mentorSpecialization: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  mentorPrice: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  mentorSessions: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xl,
  },
  emptyTitle: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  emptySubtitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
  },
});
