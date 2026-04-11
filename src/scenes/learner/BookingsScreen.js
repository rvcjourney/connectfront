import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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
import { BookingCard } from '../../components/BookingCard';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { getToken, fetchRecordingUrl, normalizeRecordingUrl } from '../../api/api';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;

export default function LearnerBookingsScreen({ navigation }) {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [profile?.id]);

  const loadBookings = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await bookingApi.getBookingsByLearner(profile.id);
      const baseBookings = data || [];

      let token = null;
      try {
        token = await getToken();
      } catch (err) {
        console.warn('Recording links unavailable:', err?.message || err);
      }

      const enriched = await Promise.all(
        baseBookings.map(async booking => {
          const existingRecordingUrl =
            booking?.recording_playback_url || booking?.recording_url || null;
          if (existingRecordingUrl) {
            return {
              ...booking,
              recordingUrl: existingRecordingUrl,
            };
          }
          if (!token || !booking?.meeting_id || booking?.status !== 'completed') {
            return booking;
          }
          const recordingUrl = await fetchRecordingUrl({
            meetingId: booking.meeting_id,
            token,
          });
          return {
            ...booking,
            recordingUrl: recordingUrl || null,
          };
        }),
      );

      setBookings(enriched);
    } catch (error) {
      console.error('Error loading learner bookings:', error);
      Toast.show('Failed to load bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleJoinCall = booking => {
    navigation.navigate('VideoCall_Screen', {
      bookingId: booking.id,
      isHost: false,
    });
  };

  const handleCancelBooking = async booking => {
    try {
      await bookingApi.cancelBooking(booking.id);
      Toast.show('Booking cancelled');
      await loadBookings();
    } catch (error) {
      Toast.show('Failed to cancel booking');
    }
  };

  const handleOpenRecording = rawUrl => {
    const url = normalizeRecordingUrl(rawUrl);
    if (!url) {
      Toast.show('Recording link is unavailable');
      return;
    }
    navigation.navigate(SCREEN_NAMES.RecordingPlayer, {
      recordingUrl: url,
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
    return (
      isSessionPast(dateStr, timeStr) ||
      b.status === 'completed' ||
      b.status === 'cancelled' ||
      b.status === 'rejected'
    );
  });

  const renderBooking = (item, isUpcoming) => {
    let statusLabel = item.status;
    if (isUpcoming && (item.status === 'pending' || item.status === 'confirmed')) {
      statusLabel = 'Booked';
    } else if (item.status === 'completed') {
      statusLabel = 'Completed';
    } else if (item.status === 'cancelled' || item.status === 'rejected') {
      statusLabel = 'Failed';
    }

    return (
      <BookingCard
        key={item.id}
        booking={item}
        isMentor={false}
        onPressJoin={isUpcoming ? () => handleJoinCall(item) : null}
        onPressCancel={isUpcoming ? () => handleCancelBooking(item) : null}
        onPressRecording={
          item.recordingUrl ? () => handleOpenRecording(item.recordingUrl) : null
        }
        statusLabel={statusLabel}
      />
    );
  };

  const renderSection = (title, subtitle, bookingsList, isUpcoming) => (
    <View key={title} style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} count={bookingsList.length} />
      {bookingsList.length > 0 ? (
        <View style={styles.cardsContainer}>
          {bookingsList.map(booking => renderBooking(booking, isUpcoming))}
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <MaterialIcons
            name={isUpcoming ? 'event-available' : 'history'}
            size={22}
            color={T.colors.text.muted}
          />
          <Text style={styles.placeholderText}>
            {isUpcoming ? 'No upcoming sessions' : 'No past sessions yet'}
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
      hasBottomTabs={false}
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
            'rgba(94, 234, 212, 0.14)',
            'rgba(167, 139, 250, 0.12)',
            'rgba(2, 0, 20, 0.5)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroRim} pointerEvents="none" />
        <View style={styles.heroIconRow}>
          <MaterialIcons name="menu-book" size={22} color={T.colors.accent.secondary} />
        </View>
        <Text style={styles.heroTitle}>My bookings</Text>
        <Text style={styles.heroSubtitle}>
          Join calls on time, and review your session history here.
        </Text>
      </View>

      {fullyEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="calendar-month" size={40} color={T.colors.accent.primary} />
          </View>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse mentors from Search and book your first session.
          </Text>
        </View>
      ) : (
        <>
          {renderSection(
            'Upcoming Session',
            'Join sessions at their scheduled time.',
            upcomingBookings,
            true,
          )}
          {renderSection(
            'Session History',
            'A record of your past sessions.',
            historyBookings,
            false,
          )}
        </>
      )}

      <LoadingOverlay
        visible={loading || refreshing}
        message={refreshing ? 'Refreshing bookings…' : 'Loading bookings…'}
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
  heroIconRow: {
    marginBottom: T.spacing.sm,
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
  },
  section: {
    marginBottom: T.spacing.xl,
  },
  cardsContainer: {
    gap: T.spacing.md,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    paddingVertical: T.spacing.lg,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  placeholderText: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    flex: 1,
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
    lineHeight: 22,
  },
});
