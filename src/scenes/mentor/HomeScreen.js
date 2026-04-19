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

  const loadDashboardData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      // All three fetches fire in parallel
      const [mentorData, bookings, earnings] = await Promise.all([
        profileApi.getMentorProfile(profile.id).catch(() => null),
        bookingApi.getBookingsByMentor(profile.id).catch(() => []),
        earningsApi.getTotalEarnings(profile.id).catch(() => 0),
      ]);

      setMentorProfile(mentorData);
      setRating(mentorData?.rating || 0);
      setTotalEarnings(earnings || 0);
      setTotalSessions(mentorData?.total_sessions || 0);

      const upcomingBookings = (bookings || []).filter(b => {
        const dateStr = b.availability_slots?.date;
        const timeStr = b.availability_slots?.start_time;
        if (!dateStr) return false;
        return (
          !isSessionPast(dateStr, timeStr) &&
          (b.status === 'pending' || b.status === 'confirmed')
        );
      });
      setTodaySessions(upcomingBookings);
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

  const PROFILE_FIELDS = [
    { key: 'photo',          label: 'Profile photo',    done: Boolean(profile?.avatar_url) },
    { key: 'name',           label: 'Full name',         done: Boolean(profile?.name?.trim()) },
    { key: 'specialization', label: 'Specialization',    done: Boolean(mentorProfile?.specialization?.trim()) },
    { key: 'bio',            label: 'Bio',               done: Boolean(mentorProfile?.bio?.trim()) },
    { key: 'price',          label: 'Session rate',      done: Boolean(mentorProfile?.price_per_hour > 0) },
    { key: 'experience',     label: 'Years of experience', done: Boolean(mentorProfile?.experience_years > 0) },
  ];
  const completedCount = PROFILE_FIELDS.filter(f => f.done).length;
  const completionPct  = Math.round((completedCount / PROFILE_FIELDS.length) * 100);
  const isComplete     = completionPct === 100;
  const missing        = PROFILE_FIELDS.filter(f => !f.done);

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
            <Image key={profile.avatar_url} source={{ uri: profile.avatar_url, cache: 'reload' }} style={styles.avatarImg} />
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

        {!isComplete ? (
          <TouchableOpacity
            style={styles.completionCard}
            onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
            activeOpacity={0.85}
          >
            {/* Header row */}
            <View style={styles.completionHeader}>
              <View style={styles.completionTitleRow}>
                <MaterialIcons name="bolt" size={18} color={T.colors.accent.warning} />
                <Text style={styles.completionTitle}>Complete your profile</Text>
              </View>
              <Text style={[
                styles.completionPct,
                completionPct >= 80 && { color: T.colors.accent.success },
              ]}>
                {completionPct}%
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={completionPct >= 80
                  ? [T.colors.accent.success, T.colors.accent.secondary]
                  : [T.colors.accent.warning, T.colors.accent.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${completionPct}%` }]}
              />
            </View>

            {/* Missing fields */}
            <View style={styles.missingRow}>
              {missing.slice(0, 3).map(f => (
                <View key={f.key} style={styles.missingChip}>
                  <MaterialIcons name="add-circle-outline" size={12} color={T.colors.accent.warning} />
                  <Text style={styles.missingLabel}>{f.label}</Text>
                </View>
              ))}
              {missing.length > 3 && (
                <View style={styles.missingChip}>
                  <Text style={styles.missingLabel}>+{missing.length - 3} more</Text>
                </View>
              )}
            </View>

            <View style={styles.completionFooter}>
              <Text style={styles.completionCta}>Tap to complete →</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.completionDone}>
            <MaterialIcons name="verified" size={16} color={T.colors.accent.success} />
            <Text style={styles.completionDoneTxt}>Profile complete — you're discoverable!</Text>
          </View>
        )}

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
  completionCard: {
    backgroundColor: 'rgba(251,191,36,0.07)',
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
    padding: T.spacing.md,
    marginTop: T.spacing.md,
    gap: T.spacing.sm,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.xs,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.colors.text.primary,
  },
  completionPct: {
    fontSize: 18,
    fontWeight: '800',
    color: T.colors.accent.warning,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 6,
  },
  missingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.xs,
  },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: T.borderRadius.round,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  missingLabel: {
    fontSize: 11,
    color: T.colors.accent.warning,
    fontWeight: '600',
  },
  completionFooter: {
    alignItems: 'flex-end',
  },
  completionCta: {
    fontSize: 12,
    color: T.colors.text.muted,
    fontWeight: '600',
  },
  completionDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.2)',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    marginTop: T.spacing.md,
  },
  completionDoneTxt: {
    fontSize: 13,
    color: T.colors.accent.success,
    fontWeight: '600',
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
