import { SafeScreen } from '../../components/SafeScreen';
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BookingCard } from '../../components/BookingCard';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';

const T = UNIFIED_THEME;
const TB = T.colors.tabBar;

/** Background poll while Sessions tab is focused (new bookings, status changes). */
const SESSIONS_POLL_MS = 30_000;

export default function MentorCallsScreen({ navigation }) {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sessionsLoaderShownRef = useRef(false);
  const lastProfileIdRef = useRef(profile?.id);

  const loadBookings = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      const quietErrors = opts.quietErrors === true;
      if (!profile?.id) return;
      try {
        if (!silent) setLoading(true);
        const data = await bookingApi.getBookingsByMentor(profile.id);
        setBookings(data || []);
      } catch (error) {
        console.error('Error loading calls:', error);
        if (!quietErrors) {
          Toast.show('Failed to load sessions');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [profile?.id],
  );

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return undefined;

      if (lastProfileIdRef.current !== profile.id) {
        lastProfileIdRef.current = profile.id;
        sessionsLoaderShownRef.current = false;
      }

      const silent = sessionsLoaderShownRef.current;
      loadBookings({ silent });
      sessionsLoaderShownRef.current = true;

      const pollId = setInterval(() => {
        loadBookings({ silent: true, quietErrors: true });
      }, SESSIONS_POLL_MS);

      return () => clearInterval(pollId);
    }, [profile?.id, loadBookings]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadBookings({ silent: true, quietErrors: false });
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinCall = booking => {
    navigation.navigate('VideoCall_Screen', {
      bookingId: booking.id,
      isHost: true,
    });
  };

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

  const historyBookings = bookings.filter(b => {
    const dateStr = b.availability_slots?.date;
    const timeStr = b.availability_slots?.start_time;
    if (!dateStr) return true;
    return isSessionPast(dateStr, timeStr) || b.status === 'completed';
  });

  const renderBooking = (item, isUpcoming) => (
    <BookingCard
      key={item.id}
      booking={item}
      isMentor={true}
      showLearnerInfo={true}
      onPressJoin={isUpcoming ? () => handleJoinCall(item) : null}
      onPressCancel={null}
      statusLabel={
        item.status === 'pending' || item.status === 'confirmed'
          ? 'Booked'
          : item.status
      }
    />
  );

  const renderSection = (title, subtitle, bookingsList, isUpcoming) => (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} count={bookingsList.length} />
      {bookingsList.length > 0 ? (
        <View style={styles.cardsContainer}>
          {bookingsList.map(booking => renderBooking(booking, isUpcoming))}
        </View>
      ) : (
        <View style={styles.emptyInline}>
          <MaterialIcons name="inbox" size={20} color={T.colors.text.muted} />
          <Text style={styles.emptyInlineText}>
            {isUpcoming ? 'Nothing scheduled yet.' : 'No past sessions in this list.'}
          </Text>
        </View>
      )}
    </View>
  );

  const fullyEmpty =
    upcomingBookings.length === 0 && historyBookings.length === 0 && !loading;

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
          style={styles.heroBeam}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[
            'rgba(94, 234, 212, 0.1)',
            'rgba(167, 139, 250, 0.1)',
            'rgba(2, 0, 20, 0.65)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.heroIconTile}>
          <MaterialIcons name="video-call" size={24} color={T.colors.accent.secondary} />
        </View>
        <Text style={styles.eyebrow}>Sessions</Text>
        <Text style={styles.pageTitle}>Your schedule</Text>
        <Text style={styles.pageSubtitle}>
          Join upcoming calls as host. Each card shows the learner and session time.
        </Text>
      </View>

      {renderSection(
        'Upcoming',
        'Sessions you can start when it is time.',
        upcomingBookings,
        true,
      )}

      {renderSection(
        'History',
        'Past and completed sessions for your records.',
        historyBookings,
        false,
      )}

      {fullyEmpty ? (
        <View style={styles.emptyHero}>
          <View style={styles.emptyHeroIcon}>
            <MaterialIcons name="video-call" size={32} color={T.colors.accent.secondary} />
          </View>
          <Text style={styles.emptyHeroTitle}>No sessions yet</Text>
          <Text style={styles.emptyHeroSub}>
            When learners book you, upcoming sessions appear here with a start call action.
          </Text>
        </View>
      ) : null}

      <View style={styles.bottomSpacer} />

      <LoadingOverlay
        visible={loading && !refreshing}
        message="Loading sessions…"
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
    backgroundColor: T.colors.primary.dark,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 3 },
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
  heroIconTile: {
    width: 48,
    height: 48,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.md,
    zIndex: 1,
  },
  eyebrow: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: T.spacing.xs,
    fontWeight: '700',
    zIndex: 1,
  },
  pageTitle: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.sm,
    zIndex: 1,
  },
  pageSubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    lineHeight: 22,
    zIndex: 1,
  },
  section: {
    marginBottom: T.spacing.xl,
  },
  cardsContainer: {
    gap: T.spacing.md,
  },
  emptyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.sm,
    paddingVertical: T.spacing.lg,
    paddingHorizontal: T.spacing.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.border.default,
  },
  emptyInlineText: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    flex: 1,
    lineHeight: 20,
  },
  emptyHero: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.card,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
    marginBottom: T.spacing.lg,
  },
  emptyHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.md,
  },
  emptyHeroTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    fontWeight: '700',
  },
  emptyHeroSub: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    textAlign: 'center',
    marginTop: T.spacing.sm,
    lineHeight: 22,
    maxWidth: 300,
  },
  bottomSpacer: {
    height: T.spacing.md,
  },
});
