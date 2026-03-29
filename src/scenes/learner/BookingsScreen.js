import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BookingCard } from '../../components/BookingCard';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';

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
      console.log('📚 Loading learner bookings for ID:', profile.id);
      const data = await bookingApi.getBookingsByLearner(profile.id);
      console.log('📚 Loaded learner bookings:', data);
      setBookings(data || []);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
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

  const handleJoinCall = (booking) => {
    navigation.navigate('VideoCall_Screen', {
      bookingId: booking.id,
      isHost: false,
    });
  };

  const handleCancelBooking = async (booking) => {
    try {
      await bookingApi.cancelBooking(booking.id);
      Toast.show('Booking cancelled');
      await loadBookings();
    } catch (error) {
      Toast.show('Failed to cancel booking');
    }
  };

  // Check if booking date is in the past
  const isDatePast = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateStr.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    return bookingDate < today;
  };

  // Split bookings into upcoming and history
  const upcomingBookings = bookings.filter(b => {
    const dateStr = b.availability_slots?.date;
    if (!dateStr) return false;
    return !isDatePast(dateStr) && (b.status === 'pending' || b.status === 'confirmed');
  });

  const historyBookings = bookings.filter(b => {
    const dateStr = b.availability_slots?.date;
    if (!dateStr) return true; // Include if no date
    return isDatePast(dateStr) || b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected';
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
        statusLabel={statusLabel}
      />
    );
  };

  const renderSection = (title, bookingsList, isUpcoming) => {
    return (
      <View key={title} style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {bookingsList.length > 0 ? (
          <View style={styles.cardsContainer}>
            {bookingsList.map(booking => renderBooking(booking, isUpcoming))}
          </View>
        ) : (
          <View style={styles.noSessionContainer}>
            <Text style={styles.noSessionText}>
              {isUpcoming ? 'No Upcoming Sessions' : 'No History Sessions'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg} hasBottomTabs={true} refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={UNIFIED_THEME.colors.primary.light}
      />
    }>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Upcoming Sessions */}
      {renderSection('📅 Upcoming Sessions', upcomingBookings, true)}

      {/* History Sessions */}
      {renderSection('📋 History Sessions', historyBookings, false)}

      {/* Empty State */}
      {upcomingBookings.length === 0 && historyBookings.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySubtitle}>Find a mentor to book your first session</Text>
        </View>
      )}

      <LoadingOverlay visible={loading || refreshing} message={refreshing ? "Refreshing bookings..." : "Loading bookings..."} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  title: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
  },
  section: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },
  sectionTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  cardsContainer: {
    gap: UNIFIED_THEME.spacing.md,
  },
  noSessionContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  noSessionText: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xl * 2,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
  },
  emptyTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.sm,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
  },
});
