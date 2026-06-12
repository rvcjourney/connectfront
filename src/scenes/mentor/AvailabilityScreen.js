import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import CosmicButton from '../../components/CosmicButton';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { availabilityApi } from '../../api/availabilityApi';
import {
  scheduleStyles,
  ScheduleSectionBlock,
  SchedulePreviewBar,
  SchedulePreviewChip,
  ScheduleDayCell,
  ScheduleHeroBanner,
  PURPLE_LINK,
  GOLD,
  TEAL,
} from '../../components/schedule/ScheduleUI';

const T = UNIFIED_THEME;
const B = T.colors.buttons;
const S = T.colors.surface;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const layoutSpring = () => {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(280, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
  );
};

const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

const SLOT_DURATION = 20;
const SLOT_BUFFER_MINS = 30;

const getDaysInMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

const formatDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateAllowed = dateStr => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  return date >= today && date <= maxDate;
};

const isTimeInPast = (dateStr, timeStr) => {
  const now = new Date();
  if (dateStr !== formatDate(now)) return false;
  const [hours, mins] = timeStr.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(hours, mins, 0, 0);
  return slotTime.getTime() - now.getTime() < SLOT_BUFFER_MINS * 60 * 1000;
};

const parseLocalDate = dateStr => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDisplayDate = dateStr =>
  parseLocalDate(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

function ScheduleTimeChip({ label, selected, booked, disabled, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selected) {
      Animated.spring(scale, { toValue: 1.04, friction: 5, useNativeDriver: true }).start();
    } else {
      scale.setValue(1);
    }
  }, [selected, scale]);

  if (booked) {
    return (
      <View style={styles.timeSlotBooked}>
        <MaterialIcons name="lock" size={12} color={T.colors.accent.warning} />
        <Text style={styles.timeSlotTextBooked}>{label}</Text>
      </View>
    );
  }

  if (selected) {
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient
            colors={B.successGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.timeSlotSelected}
          >
            <MaterialIcons name="check-circle" size={14} color={B.successText} />
            <Text style={styles.timeSlotTextSelected}>{label}</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.timeSlot,
        disabled && styles.timeSlotDisabled,
        pressed && !disabled && styles.timeSlotPressed,
      ]}
    >
      <Text style={[styles.timeSlotText, disabled && styles.timeSlotTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

export default function MentorAvailabilityScreen() {
  const { profile } = useAuth();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [allSlots, setAllSlots] = useState({});
  const [bookedSlots, setBookedSlots] = useState({});

  const mentorInitial = (profile?.name || 'M').charAt(0).toUpperCase();
  const mentorName = profile?.name || 'Mentor';

  const loadAvailability = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const availability = await availabilityApi.getAvailabilityForMentor(profile.id);

      const unbookedMap = {};
      const bookedMap = {};

      availability.forEach(slot => {
        const date = slot.date;
        const startTime = slot.start_time.substring(0, 5);
        const endTime = slot.end_time.substring(0, 5);
        const slotKey = `${startTime}-${endTime}`;

        if (slot.is_booked) {
          if (!bookedMap[date]) bookedMap[date] = [];
          if (!bookedMap[date].includes(slotKey)) bookedMap[date].push(slotKey);
        } else {
          if (!unbookedMap[date]) unbookedMap[date] = [];
          if (!unbookedMap[date].includes(slotKey)) unbookedMap[date].push(slotKey);
        }
      });

      setAllSlots(unbookedMap);
      setBookedSlots(bookedMap);
      setSelectedSlots(Array.isArray(unbookedMap[selectedDate]) ? unbookedMap[selectedDate] : []);
    } catch {
      Toast.show('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) {
        setLoading(false);
        return undefined;
      }
      loadAvailability();
      return undefined;
    }, [profile?.id, loadAvailability]),
  );

  const handleSelectDate = date => {
    layoutSpring();
    setSelectedDate(date);
    setSelectedSlots(Array.isArray(allSlots[date]) ? allSlots[date] : []);
  };

  const handleToggleSlot = slot => {
    const slotEnd = addMinutesToTime(slot, SLOT_DURATION);
    const slotKey = `${slot}-${slotEnd}`;

    if (bookedSlots[selectedDate]?.includes(slotKey)) return;

    layoutSpring();
    const updatedSlots = selectedSlots.includes(slotKey)
      ? selectedSlots.filter(s => s !== slotKey)
      : [...selectedSlots, slotKey];

    setSelectedSlots(updatedSlots);
    setAllSlots({ ...allSlots, [selectedDate]: updatedSlots });
  };

  const addMinutesToTime = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  };

  const handleSaveAvailability = async () => {
    try {
      setLoading(true);
      await availabilityApi.deleteAvailabilitySlot(profile.id);

      const insertTasks = [];
      for (const [date, slots] of Object.entries(allSlots)) {
        if (!isDateAllowed(date)) continue;
        const uniqueSlots = [...new Set(slots)];
        for (const slot of uniqueSlots) {
          const [startTime, endTime] = slot.split('-');
          if (isTimeInPast(date, startTime)) continue;
          insertTasks.push(
            availabilityApi.addAvailabilitySlot({
              mentorId: profile.id,
              date,
              startTime: `${startTime}:00`,
              endTime: `${endTime}:00`,
            }),
          );
        }
      }
      await Promise.all(insertTasks);
      Toast.show('Schedule saved successfully');
    } catch {
      Toast.show('Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const isPrevMonthDisabled =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const calendarWeeks = [];
  for (let i = 0; i < days.length; i += 7) {
    calendarWeeks.push(days.slice(i, i + 7));
  }

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const openSlotCount = selectedSlots.length;
  const bookedCount = bookedSlots[selectedDate]?.length || 0;
  const totalOpenSlots = Object.values(allSlots).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <View style={styles.screenRoot}>
      <SafeScreen scrollable padding={T.spacing.md} hasBottomTabs={false} includeTopInset={false}>
        <View style={scheduleStyles.topBar}>
          <View style={scheduleStyles.topBarSide} />
          <View style={scheduleStyles.topBarCenter}>
            <Text style={scheduleStyles.topBarTitle}>Your schedule</Text>
            <Text style={scheduleStyles.topBarSub}>Set when learners can book you</Text>
          </View>
          <View style={scheduleStyles.topBarSide} />
        </View>

        <ScheduleHeroBanner initial={mentorInitial} name={mentorName} label="Mentor schedule">
          <View style={scheduleStyles.metaRow}>
            <View style={scheduleStyles.metaPill}>
              <MaterialIcons name="date-range" size={12} color={TEAL} />
              <Text style={scheduleStyles.metaPillText}>Next 30 days</Text>
            </View>
            <View style={scheduleStyles.metaPill}>
              <MaterialIcons name="timelapse" size={12} color={GOLD} />
              <Text style={scheduleStyles.metaPillText}>20 min slots</Text>
            </View>
          </View>
        </ScheduleHeroBanner>

        <SchedulePreviewBar>
          <SchedulePreviewChip
            icon={<MaterialIcons name="event" size={13} color={GOLD} />}
            label={formatDisplayDate(selectedDate)}
          />
          <SchedulePreviewChip
            icon={<MaterialIcons name="schedule" size={13} color={TEAL} />}
            label={`${openSlotCount} open slot${openSlotCount !== 1 ? 's' : ''}`}
          />
          {bookedCount > 0 ? (
            <SchedulePreviewChip
              variant="warning"
              icon={<MaterialIcons name="lock" size={13} color={T.colors.accent.warning} />}
              label={`${bookedCount} booked`}
              textStyle={{ color: T.colors.accent.warning }}
            />
          ) : null}
        </SchedulePreviewBar>

        <ScheduleSectionBlock step="01" title="Pick a date" subtitle="Dots show days with open slots">
          <View style={scheduleStyles.calendarPanel}>
            <View style={scheduleStyles.monthHeader}>
              <TouchableOpacity
                style={[scheduleStyles.monthNavBtn, isPrevMonthDisabled && scheduleStyles.monthNavBtnDisabled]}
                onPress={() => {
                  if (isPrevMonthDisabled) return;
                  const prev = new Date(currentDate);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentDate(prev);
                }}
                disabled={isPrevMonthDisabled}
              >
                <MaterialIcons name="chevron-left" size={22} color={T.colors.text.primary} />
              </TouchableOpacity>
              <View style={scheduleStyles.monthPill}>
                <Text style={scheduleStyles.monthYear}>{monthYear}</Text>
              </View>
              <TouchableOpacity
                style={scheduleStyles.monthNavBtn}
                onPress={() => {
                  const next = new Date(currentDate);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentDate(next);
                }}
              >
                <MaterialIcons name="chevron-right" size={22} color={T.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={scheduleStyles.dayHeadersRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={`${d}-${i}`} style={scheduleStyles.dayHeader}>{d}</Text>
              ))}
            </View>

            {calendarWeeks.map((week, wi) => (
              <View key={wi} style={scheduleStyles.weekRow}>
                {week.map((day, di) => {
                  if (!day) return <View key={`e-${di}`} style={scheduleStyles.emptyDay} />;
                  const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dateStr = formatDate(dayDate);
                  const totalSlots =
                    (allSlots[dateStr]?.length || 0) + (bookedSlots[dateStr]?.length || 0);
                  const allowed = isDateAllowed(dateStr);

                  return (
                    <ScheduleDayCell
                      key={`d-${day}`}
                      day={day}
                      isSelected={selectedDate === dateStr}
                      enabled={allowed}
                      muteLabel={!allowed}
                      hasSlots={totalSlots > 0}
                      slotCount={totalSlots}
                      onPress={() => allowed && handleSelectDate(dateStr)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScheduleSectionBlock>

        <ScheduleSectionBlock
          step="02"
          title="Choose time slots"
          subtitle={`${formatDisplayDate(selectedDate)} · tap to toggle`}
          accent="teal"
        >
          <View style={styles.slotsPanel}>
            <View style={styles.slotsWrap}>
              {TIME_SLOTS.map(slot => {
                const slotEnd = addMinutesToTime(slot, SLOT_DURATION);
                const slotKey = `${slot}-${slotEnd}`;
                const isSelected = selectedSlots.includes(slotKey);
                const isBooked = bookedSlots[selectedDate]?.includes(slotKey) ?? false;
                const isPastTime = isTimeInPast(selectedDate, slot);
                const isDisabled = isPastTime || isBooked;

                return (
                  <ScheduleTimeChip
                    key={slotKey}
                    label={`${slot}–${slotEnd}`}
                    selected={isSelected}
                    booked={isBooked}
                    disabled={isDisabled}
                    onPress={() => handleToggleSlot(slot)}
                  />
                );
              })}
            </View>

            {openSlotCount > 0 ? (
              <View style={styles.summaryChip}>
                <MaterialIcons name="check-circle" size={16} color={B.successText} />
                <Text style={styles.summaryChipText}>
                  {openSlotCount} slot{openSlotCount !== 1 ? 's' : ''} open on this date
                </Text>
              </View>
            ) : (
              <View style={styles.hintRow}>
                <MaterialIcons name="tips-and-updates" size={14} color={PURPLE_LINK} />
                <Text style={styles.hintText}>Tap slots to mark when you're available</Text>
              </View>
            )}
          </View>
        </ScheduleSectionBlock>

        <View style={{ height: 100 + insets.bottom }} />
      </SafeScreen>

      <View style={[scheduleStyles.stickyBar, { paddingBottom: Math.max(insets.bottom, T.spacing.md) }]}>
        <View style={styles.saveSummary}>
          <Text style={styles.saveSummaryLabel}>Open slots across schedule</Text>
          <Text style={styles.saveSummaryCount}>{totalOpenSlots}</Text>
        </View>
        <CosmicButton
          label={loading ? 'Saving…' : 'Publish schedule'}
          variant="success"
          onPress={handleSaveAvailability}
          disabled={loading}
          loading={loading}
          style={styles.saveBtn}
        />
      </View>

      <LoadingOverlay visible={isFocused && loading} message="Updating your schedule…" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  slotsPanel: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: T.borderRadius.chip,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeSlotPressed: { opacity: 0.85 },
  timeSlotDisabled: { opacity: 0.35 },
  timeSlotSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: B.successBorder,
  },
  timeSlotBooked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: T.borderRadius.md,
    backgroundColor: S.accentWarning,
    borderWidth: 1,
    borderColor: B.warningBorder,
  },
  timeSlotText: { fontSize: 12, fontWeight: '700', color: T.colors.text.secondary },
  timeSlotTextSelected: { fontSize: 12, fontWeight: '800', color: B.successText },
  timeSlotTextBooked: { fontSize: 12, fontWeight: '700', color: T.colors.accent.warning },
  timeSlotTextDisabled: { color: T.colors.text.muted },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: T.spacing.md,
    paddingVertical: 10,
    paddingHorizontal: T.spacing.md,
    borderRadius: T.borderRadius.chip,
    backgroundColor: S.accentSuccess,
    borderWidth: 1,
    borderColor: B.successBorder,
  },
  summaryChipText: { fontSize: 13, fontWeight: '700', color: B.successText },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: T.spacing.md,
  },
  hintText: { fontSize: 12, color: T.colors.text.muted, flex: 1 },
  saveSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.sm,
  },
  saveSummaryLabel: { fontSize: 12, fontWeight: '600', color: T.colors.text.muted },
  saveSummaryCount: { fontSize: 18, fontWeight: '800', color: GOLD },
  saveBtn: { marginVertical: 0, minHeight: 50 },
});
