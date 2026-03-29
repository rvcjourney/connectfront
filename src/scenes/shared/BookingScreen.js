import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import Button from '../../components/Button';
import { availabilityApi } from '../../api/availabilityApi';
import { bookingApi } from '../../api/bookingApi';
import { useAuth } from '../../hooks/useAuth';

// Get days in month
const getDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

// Format date as YYYY-MM-DD without timezone conversion
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Safe date parsing without timezone issues
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Format date for display
const formatDisplayDate = (dateStr) => {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Check if date is in the past (compared to today)
const isPastDate = (dateStr) => {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

export default function BookingScreen({ navigation, route }) {
  const { mentorId, mentorName } = route.params;
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState(null);
  const [mentorAvailability, setMentorAvailability] = useState({});
  const [timeSlotsForDate, setTimeSlotsForDate] = useState([]);
  const [message, setMessage] = useState('');

  // Load mentor's availability
  useEffect(() => {
    loadMentorAvailability();
  }, [mentorId]);

  // Load time slots when date changes
  useEffect(() => {
    loadTimeSlotsForDate();
  }, [selectedDate, mentorAvailability]);

  const loadMentorAvailability = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading availability for mentor:', mentorId);

      const availability = await availabilityApi.getAvailabilityForMentor(mentorId);
      console.log('📅 Availability loaded:', availability);

      if (!availability || availability.length === 0) {
        console.log('⚠️ No availability found for this mentor');
        setMentorAvailability({});
        return;
      }

      // Group by date (keep slot IDs)
      const byDate = {};
      availability.forEach(slot => {
        if (!byDate[slot.date]) {
          byDate[slot.date] = [];
        }
        byDate[slot.date].push({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_booked: slot.is_booked,
        });
      });

      console.log('✅ Availability grouped by date:', byDate);
      setMentorAvailability(byDate);
    } catch (error) {
      console.error('❌ Failed to load availability:', error.message);
      Toast.show('Failed to load mentor availability: ' + error.message);
      setMentorAvailability({});
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlotsForDate = () => {
    const slots = mentorAvailability[selectedDate] || [];
    // Filter out booked slots
    const availableSlots = slots.filter(s => !s.is_booked);
    setTimeSlotsForDate(availableSlots);
    setSelectedTime(null);
  };

  const handleSelectDate = (dateStr) => {
    const slots = mentorAvailability[dateStr] || [];
    if (slots.length === 0) {
      Toast.show('No availability on this date');
      return;
    }
    setSelectedDate(dateStr);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Toast.show('Please select date and time');
      return;
    }

    if (!message.trim()) {
      Toast.show('Please share what you would like to achieve');
      return;
    }

    try {
      setBookingInProgress(true);
      console.log('📝 Creating booking:', {
        mentorId,
        learnerId: profile.id,
        slotId: selectedTime.id,
        startTime: selectedTime.start_time,
        endTime: selectedTime.end_time,
        message,
      });

      const booking = await bookingApi.createBooking({
        mentorId,
        learnerId: profile.id,
        slotId: selectedTime.id,
        message,
      });

      console.log('✅ Booking created:', booking);
      Toast.show('Booking confirmed!');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Failed to create booking:', error.message);
      Toast.show('Booking failed: ' + error.message);
    } finally {
      setBookingInProgress(false);
    }
  };

  // Calendar rendering
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = [];
  for (let i = 0; i < days.length; i += 7) {
    calendarDays.push(days.slice(i, i + 7));
  }

  return (
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg} hasBottomTabs={true}>
      <Text style={styles.title}>Book with {mentorName}</Text>
      <Text style={styles.subtitle}>Select a date and available time slot</Text>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              const prev = new Date(currentDate);
              prev.setMonth(prev.getMonth() - 1);
              setCurrentDate(prev);
            }}
          >
            <Text style={styles.navButton}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthYear}>{monthYear}</Text>
          <TouchableOpacity
            onPress={() => {
              const next = new Date(currentDate);
              next.setMonth(next.getMonth() + 1);
              setCurrentDate(next);
            }}
          >
            <Text style={styles.navButton}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeadersRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.dayHeader}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Days */}
        {calendarDays.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (!day) {
                return <View key={`empty-${dayIndex}`} style={styles.emptyDay} />;
              }

              const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateStr = formatDate(dayDate);
              const isSelected = selectedDate === dateStr;
              const isFuture = !isPastDate(dateStr);
              const hasAvailability = (mentorAvailability[dateStr] || []).length > 0;
              const availableCount = (mentorAvailability[dateStr] || []).filter(s => !s.is_booked).length;
              const canBook = isFuture && hasAvailability;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                    canBook && styles.dayButtonWithAvailability,
                    !isFuture && styles.dayButtonPast,
                  ]}
                  onPress={() => canBook && handleSelectDate(dateStr)}
                  disabled={!canBook}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                      !hasAvailability && styles.dayNumberDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasAvailability && (
                    <Text
                      style={[
                        styles.slotCount,
                        isSelected && styles.slotCountSelected,
                      ]}
                    >
                      {availableCount}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Available Time Slots */}
      {timeSlotsForDate.length > 0 && (
        <View style={styles.timeSlotsContainer}>
          <Text style={styles.sectionTitle}>
            Available Times for {formatDisplayDate(selectedDate)}
          </Text>

          <View style={styles.timeSlotsGrid}>
            {timeSlotsForDate.map((slot, index) => {
              // Format time without seconds (14:00:00 → 14:00)
              const formatTime = (timeStr) => timeStr.substring(0, 5);
              const displayText = `${formatTime(slot.start_time)}-${formatTime(slot.end_time)}`;
              const isSelected = selectedTime &&
                selectedTime.start_time === slot.start_time &&
                selectedTime.end_time === slot.end_time;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.timeSlotSelected,
                  ]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                    ]}
                  >
                    {displayText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedTime && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedInfoText}>
                Selected Slot: {selectedTime.start_time.substring(0, 5)}-{selectedTime.end_time.substring(0, 5)}
              </Text>
            </View>
          )}
        </View>
      )}

      {timeSlotsForDate.length === 0 && selectedDate && (
        <View style={styles.noSlotsContainer}>
          <Text style={styles.noSlotsText}>
            No available time slots for {formatDisplayDate(selectedDate)}
          </Text>
        </View>
      )}

      {Object.keys(mentorAvailability).length === 0 && !loading && (
        <View style={styles.noAvailabilityContainer}>
          <Text style={styles.noAvailabilityText}>
            😔 This mentor has not set their availability yet
          </Text>
          <Text style={styles.noAvailabilitySubtext}>
            Please check back later or book with another mentor
          </Text>
        </View>
      )}

      {selectedTime && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>What would you like to achieve in this session?</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Share your learning goals or questions..."
            placeholderTextColor={UNIFIED_THEME.colors.text.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          text="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          disabled={bookingInProgress}
          style={styles.actionButton}
        />
        <Button
          text={bookingInProgress ? 'Booking...' : 'Confirm Booking'}
          onPress={handleBooking}
          disabled={!selectedTime || bookingInProgress}
          style={styles.actionButton}
        />
        
      </View>

      <LoadingOverlay
        visible={loading || bookingInProgress}
        message={bookingInProgress ? "Creating booking..." : "Loading availability..."}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: UNIFIED_THEME.spacing.lg,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  monthYear: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
  },
  navButton: {
    fontSize: 24,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: 'bold',
  },
  dayHeadersRow: {
    flexDirection: 'row',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: UNIFIED_THEME.spacing.sm,
    justifyContent: 'space-between',
  },
  emptyDay: {
    width: '13.5%',
    aspectRatio: 1,
  },
  dayButton: {
    width: '13.5%',
    aspectRatio: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    opacity: 0.4,
  },
  dayButtonSelected: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    opacity: 1,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },
  dayButtonWithAvailability: {
    opacity: 1,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.accent.secondary,
  },
  dayButtonPast: {
    opacity: 0.3,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  dayNumber: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: UNIFIED_THEME.colors.primary.light,
  },
  dayNumberDisabled: {
    color: UNIFIED_THEME.colors.text.muted,
  },
  slotCount: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.primary,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
  slotCountSelected: {
    color: UNIFIED_THEME.colors.primary.light,
  },
  timeSlotsContainer: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  sectionTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: UNIFIED_THEME.spacing.md,
    gap: UNIFIED_THEME.spacing.sm,
  },
  timeSlot: {
    width: '32%',
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    marginVertical: UNIFIED_THEME.spacing.xs,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderColor: UNIFIED_THEME.colors.primary.dark,
  },
  timeSlotText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: UNIFIED_THEME.colors.primary.light,
  },
  selectedInfo: {
    backgroundColor: UNIFIED_THEME.colors.accent.success,
    borderRadius: 8,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
  },
  selectedInfoText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  noSlotsContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 8,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
  },
  noSlotsText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
  },
  noAvailabilityContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 8,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.secondary,
  },
  noAvailabilityText: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  noAvailabilitySubtext: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },
  messageLabel: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  messageInput: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    color: UNIFIED_THEME.colors.text.primary,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    ...UNIFIED_THEME.typography.bodySm,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.md,
    marginTop: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  actionButton: {
    flex: 1,
  },
});
