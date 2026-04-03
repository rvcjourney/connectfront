import { SafeScreen } from '../../components/SafeScreen';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { StatCard } from '../../components/StatCard';
import { BookingCard } from '../../components/BookingCard';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { earningsApi } from '../../api/earningsApi';
import { profileApi } from '../../api/profileApi';
import { formatCurrency } from '../../utils/formatCurrency';

export default function MentorDashboardScreen() {
  const { profile } = useAuth();
  const [mentorProfile, setMentorProfile] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData();
    }
  }, [profile?.id]);

  const loadDashboardData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      // Load mentor profile details from mentor_profiles table
      try {
        const mentorData = await profileApi.getMentorProfile(profile.id);
        setMentorProfile(mentorData);
        setRating(mentorData.rating || 4.5);
      } catch (err) {
        console.log('Mentor profile not found, using defaults');
        setRating(4.5);
      }

      // Load mentor bookings
      const bookings = await bookingApi.getBookingsByMentor(profile.id);

      // Helper: Check if date+time is in the past
      const isSessionPast = (dateStr, timeStr) => {
        const now = new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        const sessionDate = new Date(year, month - 1, day);
        if (timeStr) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          sessionDate.setHours(hours, minutes, 0, 0);
        } else {
          sessionDate.setHours(23, 59, 59, 999);
        }
        return sessionDate < now;
      };

      // Filter upcoming sessions (today and future, pending or confirmed)
      const upcomingBookings = bookings.filter(b => {
        const dateStr = b.availability_slots?.date;
        const timeStr = b.availability_slots?.start_time;
        if (!dateStr) return false;
        return !isSessionPast(dateStr, timeStr) && (b.status === 'pending' || b.status === 'confirmed');
      });
      setTodaySessions(upcomingBookings || []);

      // Load earnings
      const earnings = await earningsApi.getTotalEarnings(profile.id);
      setTotalEarnings(earnings?.total || 0);

      // Calculate stats from bookings
      const completedCount = bookings.filter(b => b.status === 'completed').length;
      setTotalSessions(completedCount);
    } catch (error) {
      Toast.show('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderSessionItem = (item) => (
    <BookingCard
      key={item.id}
      booking={item}
      isMentor={false}
      showLearnerInfo={true}
      onPressJoin={null}
      onPressCancel={null}
      statusLabel={item.status === 'pending' || item.status === 'confirmed' ? 'Booked' : item.status}
    />
  );

  return (
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={UNIFIED_THEME.colors.primary.light}
          />
        }
      >
        {/* Welcome Header */}
        {/* <Text style={styles.welcomeHeader}>Connectiqo Profile</Text> */}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            {/* Avatar - Left Side */}
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {profile?.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>

            {/* Info - Right Side */}
            <View style={styles.profileInfo}>
              {/* Name */}
              <Text style={styles.mentorName}>{profile?.name || 'Mentor'}</Text>

              {/* Specialization */}
              <Text style={styles.specialization}>
                {mentorProfile?.specialization || 'Specialist'}
              </Text>

              {/* Experience */}
              <Text style={styles.experience}>
                {mentorProfile?.experience_years || 0}+ Years Experience
              </Text>

              {/* Bio */}
              {mentorProfile?.bio && (
                <Text style={styles.bio} numberOfLines={2}>
                  {mentorProfile.bio}
                </Text>
              )}

              {/* Hourly Rate */}
              {mentorProfile?.price_per_hour && (
                <View style={styles.rateContainer}>
                  <Text style={styles.rateLabel}>Hourly Rate:</Text>
                  <Text style={styles.rateValue}>₹{mentorProfile.price_per_hour}/hr</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats Outside Card */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Earned"
            value={formatCurrency(totalEarnings)}
            icon="trending-up"
            color={UNIFIED_THEME.colors.accent.success}
          />
          <StatCard
            // icon="video-call"
            label="Sessions Done"
            value={totalSessions}
            // unit="completed"
            color={UNIFIED_THEME.colors.accent.secondary}
          />
          <StatCard
            icon="star"
            label="Rating"
            value={rating}
            // unit="⭐"
            color={UNIFIED_THEME.colors.accent.warning}
          />
        </View>

        {/* Today's Sessions */}
        <SectionHeader
          title="Today's Sessions"
          count={todaySessions.length}
        />

        {todaySessions.length > 0 ? (
          <View style={styles.sessionsContainer}>
            {todaySessions.map(session => renderSessionItem(session))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sessions scheduled for today</Text>
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="Loading dashboard..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  content: {
    flex: 1,
  },
  welcomeHeader: {
    ...UNIFIED_THEME.typography.headingXL,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.xl,
    fontSize: 24,
  },
  header: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },
  greeting: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  date: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: UNIFIED_THEME.spacing.xl,
    justifyContent: 'space-between',
    // gap: UNIFIED_THEME.spacing.md,
  },
  sessionsContainer: {
    gap: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xl,
  },
  emptyText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  profileCard: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 16,
    padding: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: UNIFIED_THEME.spacing.lg,
    marginTop: UNIFIED_THEME.spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...UNIFIED_THEME.typography.headingXL,
    color: UNIFIED_THEME.colors.primary.light,
    fontWeight: 'bold',
    fontSize: 48,
  },
  profileInfo: {
    flex: 1,
  },
  mentorName: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.xs,
    fontSize: 18,
  },
  specialization: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  experience: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  bio: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: UNIFIED_THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: UNIFIED_THEME.colors.border.light,
  },
  rateLabel: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginRight: UNIFIED_THEME.spacing.sm,
  },
  rateValue: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
  },
});
