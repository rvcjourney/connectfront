import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { SearchBar } from '../../components/SearchBar';
import { mentorApi } from '../../api/mentorApi';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function LearnerHomeScreen({ navigation }) {
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

  // Filter mentors by search query (name, specialization, category)
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

      // Only include categories that have matching mentors
      if (filteredMentors.length > 0) {
        filtered[category] = filteredMentors;
      }
    });

    return filtered;
  };

  const handleBookMentor = (mentor) => {
    navigation.navigate('Booking_Screen', {
      mentorId: mentor.id,
      mentorName: mentor.profiles?.name || 'Mentor',
    });
  };

  const handleViewProfile = (mentor) => {
    navigation.navigate('MentorProfile_Screen', { mentorId: mentor.id });
  };

  const renderMentorCard = (mentor) => (
    <View key={mentor.id} style={styles.mentorCard}>
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
      <Text style={styles.mentorSpecialization} numberOfLines={1}>
        {mentor.specialization || 'Specialist'}
      </Text>
      <Text style={styles.mentorPrice}>
        ₹{mentor.price_per_hour || '0'}/hr
      </Text>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.bookButton]}
          onPress={() => handleBookMentor(mentor)}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewProfile(mentor)}
        >
          <MaterialIcons
            name="info"
            size={16}
            color={UNIFIED_THEME.colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.title}>Find Your Mentor</Text>
        <Text style={styles.subtitle}>Book and learn from experts</Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search mentors by name..."
      />

      {(() => {
        const filteredMentors = getFilteredMentors();
        const filteredCategories = Object.keys(filteredMentors).sort();
        return filteredCategories.length > 0 ? (
          <View style={styles.content}>
            {filteredCategories.map(category =>
              renderCategorySection(category, filteredMentors[category])
            )}
          </View>
        ) : (
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Mentors Available</Text>
              <Text style={styles.emptySubtitle}>Check back soon</Text>
            </View>
          )
        );
      })()}

      <LoadingOverlay
        visible={loading || refreshing}
        message={refreshing ? 'Refreshing...' : 'Loading mentors...'}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: UNIFIED_THEME.spacing.lg,
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
    width: 140,
    marginRight: UNIFIED_THEME.spacing.md,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    padding: UNIFIED_THEME.spacing.md,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: UNIFIED_THEME.spacing.sm,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.primary.light,
    fontWeight: 'bold',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: 6,
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
    fontSize: 11,
  },
  mentorPrice: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.xs,
    marginTop: UNIFIED_THEME.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.2,
  },
  bookButton: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderColor: UNIFIED_THEME.colors.accent.primary,
  },
  bookButtonText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: '#FFF',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderColor: UNIFIED_THEME.colors.text.primary,
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
