import { SafeScreen } from './../../components/SafeScreen';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import Button from '../../components/Button';
import { StarRating } from '../../components/StarRating';
import { mentorApi } from '../../api/mentorApi';
import { formatPrice } from '../../utils/formatCurrency';

export default function MentorProfileScreen({ navigation, route }) {
  const { mentorId } = route.params;
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMentorProfile();
  }, [mentorId]);

  const loadMentorProfile = async () => {
    try {
      setLoading(true);
      const data = await mentorApi.getMentorWithProfile(mentorId);
      setMentor(data);
    } catch (err) {
      setError(err.message);
      Toast.show('Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Loading profile..." />;
  }

  if (!mentor) {
    return (
      <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mentor not found</Text>
          <Button
            text="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeScreen>
    );
  }

  const avatarUrl = mentor.profiles?.avatar_url;
  const name = mentor.profiles?.name || 'Unknown';
  const specialization = mentor.specialization || 'Not specified';
  const bio = mentor.bio || 'No bio provided';
  const experienceYears = mentor.experience_years || 0;
  const pricePerHour = mentor.price_per_hour || 0;
  const rating = mentor.rating || 0;
  const totalSessions = mentor.total_sessions || 0;

  return (
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="close"
            size={24}
            color={UNIFIED_THEME.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialIcons
                name="person"
                size={64}
                color={UNIFIED_THEME.colors.primary.light}
              />
            </View>
          )}
        </View>

        {/* Name and Specialization */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.specialization}>{specialization}</Text>

          {/* Rating */}
          <View style={styles.ratingSection}>
            <StarRating rating={rating} size={18} />
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({totalSessions} sessions)</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Experience</Text>
            <Text style={styles.statValue}>{experienceYears} years</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Price/Hour</Text>
            <Text style={styles.statValue}>{formatPrice(pricePerHour)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={styles.statValue}>{totalSessions}</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioTitle}>About</Text>
          <Text style={styles.bioText}>Profession : {specialization}</Text>
          <Text style={styles.bioText}>{bio}</Text>
        </View>
      </ScrollView>

      {/* Book Session Button */}
      <View style={styles.footer}>
        <Button
          text="Book a Session"
          onPress={() =>
            navigation.navigate('Booking_Screen', { mentorId, mentorName: name })
          }
          style={styles.bookButton}
        />
      </View>

      <LoadingOverlay visible={loading} message="Loading..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  header: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },
  avatarPlaceholder: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.xl,
  },
  name: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  specialization: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.primary.light,
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginLeft: UNIFIED_THEME.spacing.sm,
    fontWeight: '600',
  },
  ratingCount: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginLeft: UNIFIED_THEME.spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.xl,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    padding: UNIFIED_THEME.spacing.md,
    marginHorizontal: UNIFIED_THEME.spacing.sm,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.primary.light,
    alignItems: 'center',
  },
  statLabel: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  statValue: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
  },
  bioSection: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  bioTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  bioText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: UNIFIED_THEME.colors.primary.light,
  },
  bookButton: {
    marginBottom: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  errorButton: {
    width: 200,
  },
});
