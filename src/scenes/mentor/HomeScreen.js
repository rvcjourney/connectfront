import { SafeScreen } from '../../components/SafeScreen';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BookingCard } from '../../components/BookingCard';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { earningsApi } from '../../api/earningsApi';
import { profileApi } from '../../api/profileApi';
import { formatCurrency } from '../../utils/formatCurrency';

const T = UNIFIED_THEME;
const TB = T.colors.tabBar;

export default function MentorDashboardScreen() {
  const navigation = useNavigation();
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

      try {
        const mentorData = await profileApi.getMentorProfile(profile.id);
        setMentorProfile(mentorData);
        setRating(mentorData.rating || 4.5);
      } catch (err) {
        setRating(4.5);
      }

      const bookings = await bookingApi.getBookingsByMentor(profile.id);

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

      const upcomingBookings = bookings.filter(b => {
        const dateStr = b.availability_slots?.date;
        const timeStr = b.availability_slots?.start_time;
        if (!dateStr) return false;
        return (
          !isSessionPast(dateStr, timeStr) &&
          (b.status === 'pending' || b.status === 'confirmed')
        );
      });
      setTodaySessions(upcomingBookings || []);

      const earnings = await earningsApi.getTotalEarnings(profile.id);
      setTotalEarnings(earnings?.total || 0);

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

  const goTab = routeName => {
    navigation.navigate(routeName);
  };

  const renderSessionItem = item => (
    <BookingCard
      key={item.id}
      booking={item}
      isMentor={false}
      showLearnerInfo={true}
      onPressJoin={null}
      onPressCancel={null}
      statusLabel={
        item.status === 'pending' || item.status === 'confirmed'
          ? 'Booked'
          : item.status
      }
    />
  );

  const ratingDisplay =
    typeof rating === 'number' ? rating.toFixed(1) : String(rating);

  const profileComplete =
    Boolean(mentorProfile?.specialization) && Boolean(mentorProfile?.bio);

  const firstName = profile?.name?.split(/\s+/)[0] || 'there';

  return (
    <SafeScreen
      scrollable={true}
      padding={T.spacing.lg}
      includeTopInset={false}
      hasBottomTabs={false}
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
          style={styles.heroTopBeam}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[
            'rgba(94, 234, 212, 0.12)',
            'rgba(167, 139, 250, 0.12)',
            'rgba(2, 0, 20, 0.65)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />



        {/* Avatar pinned to top-right of hero card */}
        <View style={styles.heroAvatarSmall}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarImg, styles.avatarPh]}>
              <Text style={styles.avatarLetter}>
                {profile?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <MaterialIcons name="school" size={16} color={T.colors.accent.secondary} />
            <Text style={styles.heroBadgeText}>Mentor</Text>
          </View>
        </View>
        {/* <Text style={styles.heroGreeting}>Welcome back</Text> */}
        <Text style={styles.heroTitle}>Hi, {firstName}</Text>
        <Text style={styles.specialization} numberOfLines={2}>
          {mentorProfile?.specialization || 'Add your specialization'}
        </Text>
        <Text style={styles.heroSubtitle}>
          Manage sessions, track earnings, and keep your availability up to date.
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <MaterialIcons
              name="work-history"
              size={14}
              color={T.colors.accent.secondary}
            />
            <Text style={styles.heroMetaText}>
              {(mentorProfile?.experience_years ?? 0) || 0}+ yrs
            </Text>
          </View>
          <View style={styles.heroMetaChip}>
            <MaterialIcons
              name="payments"
              size={14}
              color={T.colors.accent.success}
            />
            <Text style={styles.heroMetaText}>
              {mentorProfile?.price_per_hour
                ? `₹${mentorProfile.price_per_hour}/hr`
                : 'Rate not set'}
            </Text>
          </View>
        </View>

        {!profileComplete ? (
          <TouchableOpacity
            style={styles.completionStrip}
            onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="bolt" size={20} color={T.colors.accent.warning} />
            <Text style={styles.completionText}>
              Complete your profile so learners can find and trust you.
            </Text>
            <MaterialIcons name="chevron-right" size={22} color={T.colors.text.muted} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroSnapshot}>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Total earned</Text>
            <Text style={styles.snapshotValue} numberOfLines={1}>
              {formatCurrency(totalEarnings)}
            </Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Completed</Text>
            <Text style={styles.snapshotValue}>{totalSessions}</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Rating</Text>
            <View style={styles.snapshotRatingRow}>
              <MaterialIcons name="star" size={16} color={T.colors.accent.warning} />
              <Text style={styles.snapshotValue}>{ratingDisplay}</Text>
            </View>
          </View>
        </View>
      </View>

      <SectionHeader
        title="Upcoming sessions"
        subtitle="Pending and confirmed bookings with learners."
        count={todaySessions.length}
      />

      {todaySessions.length > 0 ? (
        <View style={styles.sessionsContainer}>
          {todaySessions.map(session => renderSessionItem(session))}
        </View>
      ) : (
        <View style={styles.emptyPanel}>
          <View style={styles.emptyIconTile}>
            <MaterialIcons name="event-note" size={28} color={T.colors.accent.secondary} />
          </View>
          <Text style={styles.emptyTitle}>No upcoming sessions</Text>
          <Text style={styles.emptySub}>
            New bookings will appear here. Open Sessions to review requests.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.85 }]}
            onPress={() => goTab(SCREEN_NAMES.MentorCalls)}
          >
            <Text style={styles.emptyCtaText}>Open Sessions</Text>
            <MaterialIcons name="arrow-forward" size={18} color={T.colors.text.onAccent} />
          </Pressable>
        </View>
      )}

      <View style={styles.bottomSpacer} />

      <LoadingOverlay visible={loading && !refreshing} message="Loading dashboard…" />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: T.borderRadius.lg,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.xl,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 4 },
    }),
  },
  heroTopBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.9,
    zIndex: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
    zIndex: 1,
  },
  heroAvatarSmall: {
    position: 'absolute',
    top: T.spacing.lg,
    right: T.spacing.lg,
    width: 78,
    height: 78,
    borderRadius: T.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: T.colors.border.default,
    backgroundColor: T.colors.primary.dark,
    zIndex: 2,
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
    marginBottom: T.spacing.md,
    zIndex: 1,
    paddingRight: 76,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.md,
    zIndex: 1,
    paddingRight: 76,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: T.spacing.sm,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.input,
    flexShrink: 1,
  },
  heroMetaText: {
    ...T.typography.labelSm,
    color: T.colors.text.secondary,
    fontWeight: '700',
  },
  heroSnapshot: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: T.colors.border.light,
    paddingTop: T.spacing.md,
    marginTop: T.spacing.md,
    zIndex: 1,
  },
  snapshotItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  snapshotDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: T.colors.border.light,
    opacity: 0.7,
    marginVertical: T.spacing.xs,
  },
  snapshotLabel: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    marginBottom: 4,
    textAlign: 'center',
  },
  snapshotValue: {
    ...T.typography.labelMd,
    color: T.colors.text.primary,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  snapshotRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.colors.border.light,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.warning,
  },
  completionText: {
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
    flex: 1,
    lineHeight: 19,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPh: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.colors.component.input,
  },
  avatarLetter: {
    fontSize: 30,
    fontWeight: '800',
    color: T.colors.accent.primary,
  },
  specialization: {
    ...T.typography.bodyMd,
    color: T.colors.accent.primary,
    fontWeight: '600',
    marginBottom: T.spacing.md,
    lineHeight: 22,
  },
  sessionsContainer: {
    gap: T.spacing.md,
    marginBottom: T.spacing.lg,
  },
  emptyPanel: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxl,
    paddingHorizontal: T.spacing.lg,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderLeftWidth: 2,
    borderLeftColor: T.colors.accent.secondary,
    marginBottom: T.spacing.lg,
  },
  emptyIconTile: {
    width: 56,
    height: 56,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.md,
  },
  emptyTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    textAlign: 'center',
    marginTop: T.spacing.sm,
    lineHeight: 22,
    maxWidth: 300,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    marginTop: T.spacing.lg,
    paddingVertical: T.spacing.sm + 2,
    paddingHorizontal: T.spacing.lg,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.accent.primary,
  },
  emptyCtaText: {
    ...T.typography.labelMd,
    color: T.colors.text.onAccent,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: T.spacing.md,
  },
});
