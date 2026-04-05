import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { availabilityApi } from '../../api/availabilityApi';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

const SLOT_DURATION = 60; // minutes

const getDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const formatDate = (date) => {
  // Format as YYYY-MM-DD without timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if date is within allowed range (today to 30 days from now)
const isDateAllowed = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse date correctly in local timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  return date >= today && date <= maxDate;
};

// Check if time slot is in the past on today
const isTimeInPast = (dateStr, timeStr) => {
  const today = new Date();
  const todayStr = formatDate(today);

  if (dateStr !== todayStr) return false; // Not today

  const now = new Date();
  const [hours, mins] = timeStr.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(hours, mins, 0, 0);

  return slotTime <= now;
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

export default function MentorAvailabilityScreen({ navigation }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [allSlots, setAllSlots] = useState({});

  useEffect(() => {
    if (profile?.id) {
      loadAvailability();
    }
  }, [profile?.id]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const availability = await availabilityApi.getAvailabilityForMentor(profile.id);

      const slotsMap = {};
      availability.forEach(slot => {
        const date = slot.date;
        if (!slotsMap[date]) {
          slotsMap[date] = [];
        }
        // Remove seconds from time format (14:00:00 → 14:00)
        const startTime = slot.start_time.substring(0, 5);
        const endTime = slot.end_time.substring(0, 5);
        const slotKey = `${startTime}-${endTime}`;
        // Avoid duplicates - only add if not already present
        if (!slotsMap[date].includes(slotKey)) {
          slotsMap[date].push(slotKey);
        }
      });

      // Log for debugging
      console.log('📅 Loaded availability:', slotsMap);
      setAllSlots(slotsMap);
      if (Array.isArray(slotsMap[selectedDate])) {
        setSelectedSlots(slotsMap[selectedDate]);
      } else {
        setSelectedSlots([]);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
      Toast.show('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDate = (date) => {
    console.log('📅 Selected date:', date);
    setSelectedDate(date);
    setSelectedSlots(Array.isArray(allSlots[date]) ? allSlots[date] : []);
  };

  const handleToggleSlot = (slot) => {
    const slotEnd = addMinutesToTime(slot, SLOT_DURATION);
    const slotKey = `${slot}-${slotEnd}`;

    console.log(`🔄 Toggle slot clicked: ${slotKey}, Currently in selectedSlots: ${selectedSlots.includes(slotKey)}`);

    let updatedSlots;
    if (selectedSlots.includes(slotKey)) {
      updatedSlots = selectedSlots.filter(s => s !== slotKey);
      console.log(`🗑️ Removed slot: ${slotKey}`);
    } else {
      updatedSlots = [...selectedSlots, slotKey];
      console.log(`✅ Added slot: ${slotKey}`);
    }

    console.log(`📝 Updated selectedSlots:`, updatedSlots);
    setSelectedSlots(updatedSlots);
    setAllSlots({ ...allSlots, [selectedDate]: updatedSlots });
  };

  const addMinutesToTime = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const newMins = String(totalMins % 60).padStart(2, '0');
    return `${newHours}:${newMins}`;
  };

  const handleSaveAvailability = async () => {
    try {
      setLoading(true);

      console.log('📅 Saving availability:', { selectedDate, selectedSlots, allSlots });

      // Delete existing unbooked slots for this mentor
      await availabilityApi.deleteAvailabilitySlot(profile.id);

      // Save all slots from allSlots (deduplicated)
      for (const [date, slots] of Object.entries(allSlots)) {
        // Remove duplicates before saving
        const uniqueSlots = [...new Set(slots)];
        console.log(`📅 Saving ${uniqueSlots.length} slots for date ${date}`);
        for (const slot of uniqueSlots) {
          const [startTime, endTime] = slot.split('-');
          // Add seconds back for database storage
          await availabilityApi.addAvailabilitySlot({
            mentorId: profile.id,
            date,
            startTime: `${startTime}:00`,
            endTime: `${endTime}:00`,
          });
        }
      }

      Toast.show('Availability saved successfully');
    } catch (error) {
      console.error('Failed to save availability:', error);
      Toast.show('Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  // Calendar rendering
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const calendarDays = [];
  for (let i = 0; i < days.length; i += 7) {
    calendarDays.push(days.slice(i, i + 7));
  }

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeScreen
      scrollable={true}
      padding={UNIFIED_THEME.spacing.lg}
      hasBottomTabs={false}
      includeTopInset={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Availability</Text>
          <Text style={styles.title}>When you can teach</Text>
          <Text style={styles.subtitle}>
            Pick dates, then choose hour-long slots. Save to publish your calendar.
          </Text>
        </View>
      </View>
      <View style={styles.limitationInfo}>
        <View style={styles.limitationRow}>
          <MaterialIcons
            name="date-range"
            size={18}
            color={UNIFIED_THEME.colors.accent.secondary}
          />
          <Text style={styles.limitationText}>
            Availability can be set for the next 30 days only.
          </Text>
        </View>
        <View style={styles.limitationRow}>
          <MaterialIcons
            name="schedule"
            size={18}
            color={UNIFIED_THEME.colors.accent.primary}
          />
          <Text style={styles.limitationText}>
            Past time slots on today are disabled automatically.
          </Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        {/* Month Header with Navigation */}
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
              const hasSlots = allSlots[dateStr]?.length > 0;
              const allowed = isDateAllowed(dateStr);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                    hasSlots && styles.dayButtonWithSlots,
                    !allowed && styles.dayButtonDisabled,
                  ]}
                  onPress={() => {
                    allowed && handleSelectDate(dateStr);
                  }}
                  disabled={!allowed}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                      !allowed && styles.dayNumberDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasSlots && allowed && (
                    <Text style={[
                      styles.slotCount,
                      isSelected && styles.slotCountSelected,
                    ]}>
                      {allSlots[dateStr].length}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Time Slots for Selected Date */}
      <View style={styles.timeSlotsContainer}>
        <Text style={styles.sectionTitle}>
          Times for {formatDisplayDate(selectedDate)}
        </Text>

        <View style={styles.timeSlotsGrid}>
          {TIME_SLOTS.map(slot => {
            const slotEnd = addMinutesToTime(slot, SLOT_DURATION);
            const slotKey = `${slot}-${slotEnd}`;
            const isSelected = selectedSlots.includes(slotKey);
            const displayText = `${slot}-${slotEnd}`;
            const isPastTime = isTimeInPast(selectedDate, slot);

            return (
              <TouchableOpacity
                key={slotKey}
                style={[
                  styles.timeSlot,
                  isSelected && styles.timeSlotSelected,
                  isPastTime && styles.timeSlotDisabled,
                ]}
                onPress={() => !isPastTime && handleToggleSlot(slot)}
                disabled={isPastTime}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    isSelected && styles.timeSlotTextSelected,
                    isPastTime && styles.timeSlotTextDisabled,
                  ]}
                >
                  {displayText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedSlots.length > 0 && (
          <View style={styles.selectedSummary}>
            <Text style={styles.selectedSummaryText}>
              {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected for this date
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          text="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          disabled={loading}
          style={styles.actionButton}
        />
        <Button
          text={loading ? 'Saving...' : 'Save Changes'}
          onPress={handleSaveAvailability}
          disabled={loading}
          style={styles.actionButton}
        />
        
      </View>

      <LoadingOverlay visible={loading} message="Saving availability..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.md,
  },

  eyebrow: {
    ...UNIFIED_THEME.typography.labelSm,
    color: UNIFIED_THEME.colors.accent.secondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '800',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  subtitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
    lineHeight: 22,
  },
  limitationInfo: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.md,
  },
  limitationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: UNIFIED_THEME.spacing.sm,
  },
  limitationText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
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
    color: UNIFIED_THEME.colors.accent.primary,
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
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  dayButtonSelected: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.default,
  },
  dayButtonWithSlots: {
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.accent.secondary,
  },
  dayButtonDisabled: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    opacity: 0.5,
  },
  dayNumber: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: UNIFIED_THEME.colors.text.onAccent,
    fontWeight: '800',
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
    color: UNIFIED_THEME.colors.text.onAccent,
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
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderColor: UNIFIED_THEME.colors.accent.secondary,
  },
  timeSlotDisabled: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    opacity: 0.4,
  },
  timeSlotText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: UNIFIED_THEME.colors.text.onAccent,
    fontWeight: '700',
  },
  timeSlotTextDisabled: {
    color: UNIFIED_THEME.colors.text.muted,
  },
  selectedSummary: {
    backgroundColor: UNIFIED_THEME.colors.accent.success,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedSummaryText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.onAccent,
    textAlign: 'center',
    fontWeight: '600',
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
