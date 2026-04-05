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
import { StatCard } from '../../components/StatCard';
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

  const quickLinks = [
    {
      label: 'Sessions',
      icon: 'video-call',
      screen: SCREEN_NAMES.MentorCalls,
      color: T.colors.accent.secondary,
    },
    {
      label: 'Earnings',
      icon: 'payments',
      screen: SCREEN_NAMES.MentorEarnings,
      color: T.colors.accent.success,
    },
    {
      label: 'Schedule',
      icon: 'calendar-today',
      screen: SCREEN_NAMES.MentorAvailabilityTab,
      color: T.colors.accent.primary,
    },
  ];

  return (
    <SafeScreen
      scrollable={true}
      padding={T.spacing.lg}
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

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <MaterialIcons name="school" size={16} color={T.colors.accent.secondary} />
            <Text style={styles.heroBadgeText}>Mentor</Text>
          </View>
        </View>
        <Text style={styles.heroGreeting}>Welcome back</Text>
        <Text style={styles.heroTitle}>Hi, {firstName}</Text>
        <Text style={styles.heroSubtitle}>
          Track earnings, sessions, and what learners see on your profile.
        </Text>

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

      <View style={styles.quickStrip}>
        {quickLinks.map((item, i) => (
          <FragmentRow key={item.screen} showDivider={i > 0}>
            <Pressable
              onPress={() => goTab(item.screen)}
              style={({ pressed }) => [
                styles.quickCell,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.quickIconTile}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          </FragmentRow>
        ))}
      </View>

      <View style={styles.profileBlock}>
        <LinearGradient
          colors={TB.flatBarEdge}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.profileBlockTopBeam}
          pointerEvents="none"
        />

        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderLeft}>
            <View style={styles.profileHeaderIcon}>
              <MaterialIcons name="person-pin" size={20} color={T.colors.accent.secondary} />
            </View>
            <View style={styles.profileHeaderText}>
              <Text style={styles.profileTitle}>Public profile</Text>
              <Text style={styles.profileHint}>
                Visible to learners in search and booking
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
            style={({ pressed }) => [
              styles.editBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.editBtnText}>Edit</Text>
            <MaterialIcons name="edit" size={18} color={T.colors.accent.secondary} />
          </Pressable>
        </View>

        {!profileComplete ? (
          <TouchableOpacity
            style={styles.completionStrip}
            onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="bolt" size={20} color={T.colors.accent.warning} />
            <Text style={styles.completionText}>
              Add specialization and a bio so learners can find and trust you.
            </Text>
            <MaterialIcons name="chevron-right" size={22} color={T.colors.text.muted} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.profileBody}>
          <View style={styles.avatarTile}>
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

          <View style={styles.profileMain}>
            <View style={styles.nameRow}>
              <Text style={styles.mentorName} numberOfLines={1}>
                {profile?.name || 'Mentor'}
              </Text>
              <View style={styles.tagPro}>
                <MaterialIcons name="verified" size={14} color={T.colors.accent.secondary} />
                <Text style={styles.tagProText}>Pro</Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={16} color={T.colors.accent.warning} />
              <Text style={styles.ratingValue}>{ratingDisplay}</Text>
              <Text style={styles.ratingOutOf}>/ 5</Text>
              <Text style={styles.ratingDot}>·</Text>
              <Text style={styles.ratingLabel}>Average from learners</Text>
            </View>

            <Text style={styles.specialization} numberOfLines={2}>
              {mentorProfile?.specialization || 'Add your specialization'}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaTag}>
                <MaterialIcons name="work-history" size={14} color={T.colors.accent.secondary} />
                <Text style={styles.metaTagText}>
                  {(mentorProfile?.experience_years ?? 0) || 0}+ yrs experience
                </Text>
              </View>
              {mentorProfile?.price_per_hour ? (
                <View style={styles.metaTag}>
                  <MaterialIcons name="payments" size={14} color={T.colors.accent.primary} />
                  <Text style={styles.metaTagText}>₹{mentorProfile.price_per_hour} / hr</Text>
                </View>
              ) : null}
            </View>

            {mentorProfile?.bio ? (
              <Text style={styles.bio} numberOfLines={4}>
                {mentorProfile.bio}
              </Text>
            ) : (
              <Text style={styles.bioMuted}>
                A short bio builds trust. Tap Edit to tell learners how you can help.
              </Text>
            )}
          </View>
        </View>
      </View>

      <SectionHeader
        title="Performance"
        subtitle="Totals from completed work and feedback."
      />

      <View style={styles.statsRow}>
        <StatCard
          label="Total earned"
          value={formatCurrency(totalEarnings)}
          icon="account-balance-wallet"
          color={T.colors.accent.success}
        />
        <StatCard
          label="Sessions done"
          value={String(totalSessions)}
          icon="event-available"
          color={T.colors.accent.secondary}
        />
        <StatCard
          label="Rating"
          value={ratingDisplay}
          icon="star"
          color={T.colors.accent.warning}
        />
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
            New bookings will show up here. Use Sessions to join live calls when it is time.
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

/** Wraps quick-strip cell + optional vertical divider (flat layout). */
function FragmentRow({ children, showDivider }) {
  return (
    <>
      {showDivider ? <View style={mentorDashStyles.quickDivider} /> : null}
      <View style={mentorDashStyles.quickCellWrap}>{children}</View>
    </>
  );
}

const mentorDashStyles = StyleSheet.create({
  quickDivider: {
    width: StyleSheet.hairlineWidth * 2,
    alignSelf: 'stretch',
    marginVertical: T.spacing.md,
    backgroundColor: T.colors.border.light,
    opacity: 0.45,
  },
  quickCellWrap: {
    flex: 1,
    minWidth: 0,
  },
});

const styles = StyleSheet.create({
  hero: {
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.primary.dark,
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
  heroGreeting: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: T.spacing.xs,
    fontWeight: '700',
    zIndex: 1,
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
  heroSnapshot: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: T.colors.border.light,
    paddingTop: T.spacing.md,
    marginTop: -T.spacing.xs,
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
  quickStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 2 },
    }),
  },
  quickCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.md,
    paddingHorizontal: T.spacing.xs,
  },
  quickIconTile: {
    width: 44,
    height: 44,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
  },
  quickLabel: {
    ...T.typography.labelSm,
    color: T.colors.text.secondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileBlock: {
    marginBottom: T.spacing.xl,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: T.colors.border.default,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 3 },
    }),
  },
  profileBlockTopBeam: {
    height: 2,
    width: '100%',
    opacity: 0.85,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
    paddingBottom: T.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.colors.border.light,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    flex: 1,
    marginRight: T.spacing.sm,
  },
  profileHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  profileTitle: {
    ...T.typography.labelMd,
    color: T.colors.text.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  profileHint: {
    ...T.typography.bodyXs,
    color: T.colors.text.muted,
    marginTop: 3,
    lineHeight: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: T.spacing.sm,
    paddingHorizontal: T.spacing.md,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.colors.border.default,
    backgroundColor: T.colors.component.input,
  },
  editBtnText: {
    ...T.typography.labelMd,
    color: T.colors.accent.secondary,
    fontWeight: '700',
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
  profileBody: {
    flexDirection: 'row',
    padding: T.spacing.lg,
    alignItems: 'flex-start',
    gap: T.spacing.lg,
  },
  avatarTile: {
    width: 96,
    height: 96,
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: T.colors.border.default,
    backgroundColor: T.colors.primary.dark,
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
    fontSize: 36,
    fontWeight: '800',
    color: T.colors.accent.primary,
  },
  profileMain: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
    marginBottom: T.spacing.xs,
  },
  mentorName: {
    ...T.typography.headingSm,
    fontSize: 19,
    color: T.colors.text.primary,
    fontWeight: '800',
    flexShrink: 1,
  },
  tagPro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 4,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  tagProText: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: T.spacing.sm,
  },
  ratingValue: {
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    fontWeight: '800',
  },
  ratingOutOf: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
  },
  ratingDot: {
    color: T.colors.text.muted,
    marginHorizontal: 2,
  },
  ratingLabel: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
  },
  specialization: {
    ...T.typography.bodyMd,
    color: T.colors.accent.primary,
    fontWeight: '600',
    marginBottom: T.spacing.md,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
    marginBottom: T.spacing.md,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: T.spacing.sm,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  metaTagText: {
    ...T.typography.labelSm,
    color: T.colors.text.secondary,
    fontWeight: '600',
  },
  bio: {
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
    lineHeight: 21,
  },
  bioMuted: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.xl,
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
    borderLeftWidth: 3,
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
