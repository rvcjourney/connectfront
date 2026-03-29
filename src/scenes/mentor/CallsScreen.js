import { SafeScreen } from './../../components/SafeScreen';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BookingCard } from '../../components/BookingCard';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';

export default function MentorCallsScreen({ navigation }) {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadBookings();
    }
  }, [profile?.id]);

  const loadBookings = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      console.log('📞 Loading mentor bookings for ID:', profile.id);
      const data = await bookingApi.getBookingsByMentor(profile.id);
      console.log('📞 Raw mentor bookings:', data);

      // Debug: Log availability slots for each booking
      data?.forEach((booking, idx) => {
        console.log(`📞 Booking ${idx}:`, {
          id: booking.id,
          status: booking.status,
          date: booking.availability_slots?.date,
          time: booking.availability_slots?.start_time,
        });
      });

      setBookings(data || []);
    } catch (error) {
      console.error('❌ Error loading calls:', error);
      Toast.show('Failed to load calls: ' + error.message);
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
      isHost: true,
    });
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
    if (!dateStr) return true;
    return isDatePast(dateStr) || b.status === 'completed';
  });

  const renderBooking = (item, isUpcoming) => (
    <BookingCard
      key={item.id}
      booking={item}
      isMentor={true}
      showLearnerInfo={true}
      onPressJoin={isUpcoming ? () => handleJoinCall(item) : null}
      onPressCancel={null}
      statusLabel={(item.status === 'pending' || item.status === 'confirmed') ? 'Booked' : item.status}
    />
  );

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
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg}>
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={UNIFIED_THEME.colors.accent.secondary}
          />
        }
        scrollEnabled={true}
      >
        {/* Upcoming Sessions */}
        {renderSection('📅 Upcoming Sessions', upcomingBookings, true)}

        {/* History Sessions */}
        {renderSection('📋 History Sessions', historyBookings, false)}

        {/* Empty State */}
        {upcomingBookings.length === 0 && historyBookings.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No sessions scheduled</Text>
            <Text style={styles.emptySubtitle}>Your schedule is empty</Text>
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="Loading sessions..." />
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
