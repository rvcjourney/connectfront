import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  TextInput,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Easing,
  ScrollView,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import CelebrationPayButton from '../../components/CelebrationPayButton';
import {
  scheduleStyles,
  ScheduleSectionBlock,
  SchedulePreviewBar,
  SchedulePreviewChip,
  ScheduleDayCell,
  ScheduleHeroBanner,
} from '../../components/schedule/ScheduleUI';
import { availabilityApi } from '../../api/availabilityApi';
import { paymentApi } from '../../api/paymentApi';
import { profileApi } from '../../api/profileApi';
import { scheduleSessionReminder, requestNotificationPermission } from '../../utils/sessionReminder';
import { calculateFees } from '../../utils/feeCalculator';
import { useAuth } from '../../hooks/useAuth';
import { SCREEN_NAMES } from '../../navigators/screenNames';

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

// ─── Date helpers ──────────────────────────────────────────────────────────
const getDaysInMonth = d => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

const formatDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDate = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDisplayDate = s =>
  parseLocalDate(s).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const isPastDate = s => {
  const d = parseLocalDate(s);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

function FadeInSection({ show, children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!show) {
      opacity.setValue(0);
      translateY.setValue(28);
      scale.setValue(0.94);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 65,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [show, delay, opacity, translateY, scale]);

  if (!show) return null;

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}

const GOAL_PROMPTS = [
  'Career guidance',
  'Interview prep',
  'Skill improvement',
  'Project feedback',
  'Resume review',
];

/** CTA copy framed around booking & ownership — avoids “pay” loss-aversion. */
function getBookingCtaLabel({ paying, readyToPay, fees, selectedTime, message }) {
  if (paying) return 'Securing your spot…';
  if (!fees) return 'Get started';
  if (readyToPay) return `Secure My Spot · ₹${fees.totalAmount}`;
  if (selectedTime && !message.trim()) return 'One step left to book';
  if (selectedTime) return `Book My Session · ₹${fees.totalAmount}`;
  return 'Choose your slot';
}

function SessionPreviewBar({ selectedDate, selectedTime, mentorName, readyToPay }) {
  if (!selectedDate && !selectedTime) return null;

  const fmt = t => (t ? t.substring(0, 5) : '');
  const timeLabel = selectedTime
    ? `${fmt(selectedTime.start_time)} – ${fmt(selectedTime.end_time)}`
    : null;

  return (
    <SchedulePreviewBar>
      <SchedulePreviewChip
        icon={<MaterialIcons name="person" size={13} color={T.colors.accent.secondary} />}
        label={mentorName}
      />
      {selectedDate ? (
        <SchedulePreviewChip
          icon={<MaterialIcons name="event" size={13} color={T.colors.accent.primary} />}
          label={formatDisplayDate(selectedDate)}
        />
      ) : null}
      {timeLabel ? (
        <SchedulePreviewChip
          icon={<MaterialIcons name="schedule" size={13} color={T.colors.accent.success} />}
          label={timeLabel}
        />
      ) : null}
      {readyToPay ? (
        <SchedulePreviewChip
          variant="ready"
          icon={<MaterialIcons name="check-circle" size={13} color={B.successText} />}
          label="Ready"
          textStyle={{ color: B.successText }}
        />
      ) : null}
    </SchedulePreviewBar>
  );
}

function GoalPromptChips({ onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.promptRow}
    >
      {GOAL_PROMPTS.map(label => (
        <TouchableOpacity
          key={label}
          style={styles.promptChip}
          onPress={() => onSelect(label)}
          activeOpacity={0.8}
        >
          <Text style={styles.promptChipText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function FeeRow({ label, amount, accent, bold }) {
  return (
    <View style={feeStyles.row}>
      <Text style={[feeStyles.label, bold && feeStyles.bold]}>{label}</Text>
      <Text style={[feeStyles.amount, bold && feeStyles.bold, accent && feeStyles.accent]}>
        ₹{amount}
      </Text>
    </View>
  );
}

function TimeSlotChip({ slot, selected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selected) {
      Animated.spring(scale, { toValue: 1.04, friction: 5, useNativeDriver: true }).start();
    } else {
      scale.setValue(1);
    }
  }, [selected, scale]);

  const fmt = t => t.substring(0, 5);
  const label = `${fmt(slot.start_time)} – ${fmt(slot.end_time)}`;

  if (selected) {
    return (
      <Pressable onPress={onPress} style={styles.timeSlotHWrap}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient
            colors={B.successGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.timeSlotHSelected}
          >
            <MaterialIcons name="videocam" size={15} color={B.successText} />
            <Text style={styles.timeSlotTextSelected}>{label}</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.timeSlotH, pressed && styles.timeSlotPressed]}
    >
      <Text style={styles.timeSlotText}>{label}</Text>
    </Pressable>
  );
}

const feeStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { ...T.typography.bodySm, color: T.colors.text.secondary },
  amount: { ...T.typography.bodySm, color: T.colors.text.secondary },
  bold: { fontWeight: '800', color: T.colors.text.primary, fontSize: 15 },
  accent: { color: T.colors.accent.primary, fontSize: 17 },
});

export default function BookingScreen({ navigation, route }) {
  const { mentorId, mentorName } = route.params;
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState(null);
  const [mentorAvailability, setMentorAvailability] = useState({});
  const [timeSlotsForDate, setTimeSlotsForDate] = useState([]);
  const [message, setMessage] = useState('');
  const [pricePerHour, setPricePerHour] = useState(0);
  const [feeConfig, setFeeConfig] = useState(null);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;
  const checkoutSlide = useRef(new Animated.Value(80)).current;
  const checkoutOpacity = useRef(new Animated.Value(0.6)).current;
  const totalPop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [headerFade, headerSlide]);

  const loadMentorData = useCallback(async () => {
    try {
      setLoading(true);
      const [availability, mentorProfile] = await Promise.all([
        availabilityApi.getAvailabilityForMentor(mentorId),
        profileApi.getMentorProfile(mentorId),
      ]);

      setPricePerHour(mentorProfile?.price_per_hour || 0);

      if (profile?.id) {
        const rule = await paymentApi.getFeeRule();
        setFeeConfig(
          rule
            ? {
                platformFeePercent: Number(rule.platform_fee_percent),
                gstPercent: Number(rule.gst_percent),
              }
            : null,
        );
      }

      if (!availability?.length) {
        setMentorAvailability({});
        return;
      }

      const byDate = {};
      availability.forEach(slot => {
        if (!byDate[slot.date]) byDate[slot.date] = [];
        byDate[slot.date].push({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_booked: slot.is_booked,
        });
      });
      setMentorAvailability(byDate);
    } catch (err) {
      Toast.show('Failed to load mentor data: ' + err.message);
      setMentorAvailability({});
    } finally {
      setLoading(false);
    }
  }, [mentorId, profile?.id]);

  useEffect(() => {
    loadMentorData();
  }, [loadMentorData]);

  useEffect(() => {
    layoutSpring();
    const slots = mentorAvailability[selectedDate] || [];
    const available = slots
      .filter(s => !s.is_booked)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    setTimeSlotsForDate(available);
    setSelectedTime(null);
  }, [selectedDate, mentorAvailability]);

  const handleSelectDate = dateStr => {
    if (!(mentorAvailability[dateStr]?.length)) {
      Toast.show('No availability on this date');
      return;
    }
    layoutSpring();
    setSelectedDate(dateStr);
  };

  const handleSelectTime = slot => {
    layoutSpring();
    setSelectedTime(slot);
  };

  const fees = pricePerHour > 0 ? calculateFees(pricePerHour, feeConfig || undefined) : null;

  const readyToPay = Boolean(
    selectedTime && message.trim().length > 0 && fees && !paying,
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkoutSlide, {
        toValue: 0,
        friction: 9,
        tension: 55,
        useNativeDriver: true,
      }),
      Animated.timing(checkoutOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkoutSlide, checkoutOpacity]);

  useEffect(() => {
    if (readyToPay && fees) {
      Animated.spring(totalPop, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    } else {
      totalPop.setValue(0);
    }
  }, [readyToPay, fees, totalPop]);

  const mentorInitial = (mentorName || 'M').charAt(0).toUpperCase();

  const handlePay = async () => {
    if (!selectedDate || !selectedTime) {
      Toast.show('Please select a date and time slot');
      return;
    }
    if (!message.trim()) {
      Toast.show('Please share what you want to achieve');
      return;
    }
    if (!fees) {
      Toast.show('Unable to load pricing. Please go back and try again.');
      return;
    }

    try {
      setPaying(true);

      const order = await paymentApi.createOrder({
        mentorId,
        learnerId: profile.id,
        slotId: selectedTime.id,
        message: message.trim(),
      });

      const razorpayOptions = {
        description: `1-on-1 session with ${mentorName}`,
        currency: order.currency,
        key: order.keyId,
        amount: String(order.amount),
        order_id: order.orderId,
        name: 'Connectiqo',
        prefill: {
          email: profile.email || '',
          contact: profile.phone || '',
          name: profile.name || '',
        },
        theme: { color: T.colors.accent.secondary },
      };

      const paymentData = await RazorpayCheckout.open(razorpayOptions);

      const verifyResult = await paymentApi.verifyAndBook({
        razorpayOrderId: order.orderId,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        mentorId,
        learnerId: profile.id,
        slotId: selectedTime.id,
        message: message.trim(),
      });

      const newBookingId = verifyResult?.bookingId;
      if (!newBookingId) {
        console.warn('verifyAndBook returned no bookingId; reminder not scheduled');
      }

      await requestNotificationPermission();
      if (newBookingId) {
        await scheduleSessionReminder({
          bookingId: newBookingId,
          sessionDate: selectedDate,
          sessionTime: selectedTime.start_time,
          mentorName,
          isMentor: false,
        });
      }

      Toast.show('Booking confirmed! Payment successful.');
      navigation.navigate(SCREEN_NAMES.RootUnifiedTabs, {
        screen: SCREEN_NAMES.LearnerSection,
        params: { screen: SCREEN_NAMES.LearnerBookings },
      });
    } catch (err) {
      if (err?.code === 'PAYMENT_CANCELLED' || err?.description === 'Payment cancelled') {
        Toast.show('Payment cancelled');
      } else {
        console.error('Payment error:', err);
        Toast.show(err.message || 'Payment failed. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1),
  );
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarWeeks = [];
  for (let i = 0; i < days.length; i += 7) {
    calendarWeeks.push(days.slice(i, i + 7));
  }

  return (
    <View style={styles.screenRoot}>
      <SafeScreen scrollable padding={T.spacing.md} hasBottomTabs={false}>
        <View style={scheduleStyles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={12}
            disabled={paying}
          >
            <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
          </TouchableOpacity>
          <View style={scheduleStyles.topBarCenter}>
            <Text style={scheduleStyles.topBarTitle}>Book a session</Text>
            <Text style={scheduleStyles.topBarSub}>Secure your 1-on-1 slot</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
          <ScheduleHeroBanner initial={mentorInitial} name={mentorName} label="Mentor">
            <View style={scheduleStyles.metaRow}>
              <View style={scheduleStyles.metaPill}>
                <MaterialIcons name="videocam" size={12} color={T.colors.accent.secondary} />
                <Text style={scheduleStyles.metaPillText}>Live · 60 min</Text>
              </View>
              {pricePerHour > 0 ? (
                <View style={scheduleStyles.metaPill}>
                  <MaterialIcons name="payments" size={12} color={T.colors.accent.primary} />
                  <Text style={scheduleStyles.metaPillText}>₹{pricePerHour}/hr</Text>
                </View>
              ) : null}
            </View>
          </ScheduleHeroBanner>

          <SessionPreviewBar
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            mentorName={mentorName}
            readyToPay={readyToPay}
          />
        </Animated.View>

        <ScheduleSectionBlock step="01" title="Pick a date" subtitle="Highlighted days have open slots">
          <View style={scheduleStyles.calendarPanel}>
            <View style={scheduleStyles.monthHeader}>
              <TouchableOpacity
                style={scheduleStyles.monthNavBtn}
                onPress={() => {
                  const p = new Date(currentDate);
                  p.setMonth(p.getMonth() - 1);
                  setCurrentDate(p);
                }}
              >
                <MaterialIcons name="chevron-left" size={22} color={T.colors.text.primary} />
              </TouchableOpacity>
              <View style={scheduleStyles.monthPill}>
                <Text style={scheduleStyles.monthYear}>{monthYear}</Text>
              </View>
              <TouchableOpacity
                style={scheduleStyles.monthNavBtn}
                onPress={() => {
                  const n = new Date(currentDate);
                  n.setMonth(n.getMonth() + 1);
                  setCurrentDate(n);
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
                  const isSelected = selectedDate === dateStr;
                  const isFuture = !isPastDate(dateStr);
                  const hasSlots = (mentorAvailability[dateStr] || []).length > 0;
                  const availableCount = (mentorAvailability[dateStr] || []).filter(
                    s => !s.is_booked,
                  ).length;
                  const canBook = isFuture && hasSlots && availableCount > 0;

                  return (
                    <ScheduleDayCell
                      key={`d-${day}`}
                      day={day}
                      isSelected={isSelected}
                      enabled={canBook}
                      muteLabel={!hasSlots}
                      hasSlots={hasSlots}
                      slotCount={availableCount}
                      onPress={() => canBook && handleSelectDate(dateStr)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScheduleSectionBlock>

        <FadeInSection show={timeSlotsForDate.length > 0} delay={60}>
          <ScheduleSectionBlock
            step="02"
            title="Choose a time"
            subtitle={formatDisplayDate(selectedDate)}
            accent="teal"
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeScrollContent}
            >
              {timeSlotsForDate.map((slot, idx) => (
                <TimeSlotChip
                  key={slot.id || idx}
                  slot={slot}
                  selected={
                    selectedTime?.start_time === slot.start_time &&
                    selectedTime?.end_time === slot.end_time
                  }
                  onPress={() => handleSelectTime(slot)}
                />
              ))}
            </ScrollView>
          </ScheduleSectionBlock>
        </FadeInSection>

        {timeSlotsForDate.length === 0 && selectedDate && !loading && (
          <FadeInSection show delay={0}>
            <View style={styles.emptyCard}>
              <MaterialIcons name="event-busy" size={32} color={T.colors.text.muted} />
              <Text style={styles.emptyTitle}>No slots this day</Text>
              <Text style={styles.emptySub}>Swipe the calendar to find another date</Text>
            </View>
          </FadeInSection>
        )}

        {Object.keys(mentorAvailability).length === 0 && !loading && (
          <View style={styles.emptyCard}>
            <MaterialIcons name="sentiment-dissatisfied" size={36} color={T.colors.accent.secondary} />
            <Text style={styles.emptyTitle}>No availability yet</Text>
            <Text style={styles.emptySub}>This mentor hasn't opened booking slots</Text>
          </View>
        )}

        <FadeInSection show={!!selectedTime} delay={100}>
          <ScheduleSectionBlock
            step="03"
            title="Session goal"
            subtitle={`What should ${mentorName.split(' ')[0]} focus on?`}
            accent="gold"
          >
            <GoalPromptChips
              onSelect={text => setMessage(prev => (prev.trim() ? `${prev.trim()}. ${text}` : text))}
            />
            <TextInput
              style={styles.messageInput}
              placeholder="Describe your goals, questions, or what success looks like…"
              placeholderTextColor={T.colors.text.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <View style={styles.charRow}>
              <MaterialIcons name="tips-and-updates" size={14} color={T.colors.text.muted} />
              <Text style={styles.charHint}>Clear goals help mentors prepare better</Text>
              <Text style={styles.charCount}>{message.length}/500</Text>
            </View>
          </ScheduleSectionBlock>
        </FadeInSection>

        <FadeInSection show={!!selectedTime && !!fees} delay={140}>
          <ScheduleSectionBlock step="04" title="Confirm your session" subtitle="Clear, upfront pricing" accent="violet">
            <View style={styles.ticketCard}>
              <View style={styles.ticketTop}>
                <View>
                  <Text style={styles.ticketLabel}>Session ticket</Text>
                  <Text style={styles.ticketMentor}>{mentorName}</Text>
                </View>
                <MaterialIcons name="confirmation-number" size={28} color={T.colors.accent.primary} />
              </View>
              <View style={styles.ticketPerforation}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <View key={i} style={styles.perfDot} />
                ))}
              </View>
              <FeeRow label="Session fee (1 hr)" amount={fees?.mentorAmount} />
              <FeeRow label={`Convenience (${fees?.platformFeePercent}%)`} amount={fees?.platformBaseFee} />
              <FeeRow label={`GST (${fees?.gstPercent}%)`} amount={fees?.gstOnFee} />
              <View style={styles.feeDivider} />
              <FeeRow label="Your session total" amount={fees?.totalAmount} bold accent />
              <View style={styles.secureRow}>
                <MaterialIcons name="lock" size={14} color={T.colors.accent.success} />
                <Text style={styles.secureText}>Safe & encrypted checkout</Text>
              </View>
            </View>
          </ScheduleSectionBlock>
        </FadeInSection>

        <View style={{ height: 120 + insets.bottom }} />
      </SafeScreen>

      {/* Sticky checkout */}
      <Animated.View
        style={[
          scheduleStyles.stickyBar,
          {
            paddingBottom: Math.max(insets.bottom, T.spacing.md),
            opacity: checkoutOpacity,
            transform: [{ translateY: checkoutSlide }],
          },
        ]}
      >
        <View style={styles.checkoutFooter}>
          {selectedTime && fees ? (
            <Animated.View
              style={[
                styles.checkoutTotalRow,
                {
                  transform: [
                    {
                      scale: totalPop.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.03],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View>
                <Text style={styles.checkoutTotalLabel}>
                  {readyToPay ? 'Ready to book' : 'Session estimate'}
                </Text>
              </View>
              <Text style={styles.checkoutTotalAmount}>₹{fees.totalAmount}</Text>
            </Animated.View>
          ) : (
            <Text style={styles.checkoutHint}>
              {selectedTime ? 'Add your session goal to continue' : 'Select date & time to continue'}
            </Text>
          )}

          <CelebrationPayButton
            label={getBookingCtaLabel({
              paying,
              readyToPay,
              fees,
              selectedTime,
              message,
            })}
            onPress={handlePay}
            disabled={!selectedTime || !message.trim() || paying}
            loading={paying}
            ready={readyToPay}
            size="checkout"
            style={styles.checkoutPayBtn}
          />
        </View>
      </Animated.View>

      <LoadingOverlay
        visible={loading || paying}
        message={paying ? 'Securing your session…' : 'Loading availability…'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...T.typography.bodyLg,
    color: T.colors.text.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarSub: {
    fontSize: 11,
    color: T.colors.text.muted,
    marginTop: 2,
  },

  mentorBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    overflow: 'hidden',
    marginBottom: T.spacing.md,
    padding: T.spacing.lg,
  },
  mentorBannerRow: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.md },
  mentorBannerBody: { flex: 1, minWidth: 0 },
  mentorBannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: T.colors.accent.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mentorBannerName: {
    fontSize: 20,
    fontWeight: '800',
    color: T.colors.text.primary,
    marginTop: 2,
  },
  mentorBannerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  metaPillText: { fontSize: 11, fontWeight: '600', color: T.colors.text.secondary },

  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    paddingVertical: 10,
    paddingHorizontal: T.spacing.md,
    marginBottom: T.spacing.lg,
    overflow: 'hidden',
  },
  previewScroll: { gap: 8, paddingRight: 8 },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  previewChipReady: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: B.successBorder,
  },
  previewChipText: { fontSize: 12, fontWeight: '700', color: T.colors.text.secondary, maxWidth: 140 },

  sectionBlock: { marginBottom: T.spacing.lg },
  sectionBlockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    marginBottom: T.spacing.md,
  },
  sectionStepBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionAccentGold: {
    backgroundColor: 'rgba(240, 216, 117, 0.12)',
    borderColor: B.goldOutlineBorder,
  },
  sectionAccentTeal: {
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    borderColor: B.outlineBorder,
  },
  sectionAccentViolet: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderColor: B.secondaryBorder,
  },
  sectionStepNum: { fontSize: 13, fontWeight: '900', color: T.colors.text.primary },
  sectionBlockTitles: { flex: 1 },
  sectionBlockTitle: { fontSize: 17, fontWeight: '800', color: T.colors.text.primary },
  sectionBlockSub: { fontSize: 12, color: T.colors.text.muted, marginTop: 2 },

  calendarPanel: {
    backgroundColor: T.colors.component.input,
    borderRadius: 16,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  monthPill: {
    paddingHorizontal: T.spacing.lg,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: T.colors.component.card,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },

  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: T.colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: T.colors.accent.primary },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.md,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 16,
    color: T.colors.text.primary,
    fontWeight: '700',
  },
  dayHeadersRow: { flexDirection: 'row', marginBottom: T.spacing.sm },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: T.colors.text.muted,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  emptyDay: { width: '13.2%', aspectRatio: 1 },
  dayCellWrap: { width: '13.2%', aspectRatio: 1 },
  dayButton: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.colors.component.card,
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.35,
  },
  dayButtonAvailable: {
    opacity: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },
  dayButtonPast: { opacity: 0.2 },
  dayButtonPressed: { opacity: 0.85 },
  dayButtonSelected: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: B.primaryBorder,
  },
  dayNumber: { fontSize: 14, color: T.colors.text.primary, fontWeight: '700' },
  dayNumberSelected: { color: B.primaryText, fontWeight: '800' },
  dayNumberDisabled: { color: T.colors.text.muted },
  slotDot: {
    position: 'absolute',
    bottom: 3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(94, 234, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  slotDotSelected: { backgroundColor: 'rgba(6, 4, 18, 0.35)' },
  slotDotText: { fontSize: 8, fontWeight: '800', color: T.colors.accent.secondary },
  slotDotTextSelected: { color: B.primaryText },

  timeScrollContent: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    paddingVertical: 4,
    paddingRight: T.spacing.md,
  },
  timeSlotHWrap: { marginRight: 0 },
  timeSlotH: {
    paddingVertical: 12,
    paddingHorizontal: T.spacing.lg,
    borderRadius: 24,
    backgroundColor: T.colors.component.card,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    marginRight: T.spacing.sm,
  },
  timeSlotHSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: T.spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: B.successBorder,
  },
  timeSlotPressed: { opacity: 0.85 },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.colors.text.secondary,
  },
  timeSlotTextSelected: {
    fontSize: 14,
    fontWeight: '800',
    color: B.successText,
  },

  promptRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: T.spacing.md,
    paddingRight: T.spacing.md,
  },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: S.promptChip,
    borderWidth: 1,
    borderColor: B.primaryBorder,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.colors.accent.primary,
  },

  messageInput: {
    backgroundColor: T.colors.component.card,
    color: T.colors.text.primary,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    minHeight: 110,
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: T.spacing.sm,
  },
  charHint: {
    flex: 1,
    fontSize: 11,
    color: T.colors.text.muted,
  },
  charCount: {
    fontSize: 11,
    color: T.colors.text.muted,
  },

  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: B.secondaryBorder,
    padding: T.spacing.lg,
    backgroundColor: T.colors.component.input,
    overflow: 'hidden',
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: T.spacing.md,
  },
  ticketLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: T.colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ticketMentor: {
    fontSize: 17,
    fontWeight: '800',
    color: T.colors.text.primary,
    marginTop: 4,
  },
  ticketPerforation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.md,
    overflow: 'hidden',
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.colors.border.light,
  },
  feeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.colors.border.light,
    marginVertical: T.spacing.md,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: T.spacing.md,
  },
  secureText: { ...T.typography.bodySm, color: T.colors.text.muted },

  emptyCard: {
    alignItems: 'center',
    padding: T.spacing.xxl,
    marginBottom: T.spacing.md,
    backgroundColor: T.colors.component.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    gap: T.spacing.sm,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: T.colors.text.primary },
  emptySub: { ...T.typography.bodySm, color: T.colors.text.muted, textAlign: 'center' },

  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: T.colors.border.light,
    backgroundColor: S.checkoutBar,
    overflow: 'visible',
  },
  checkoutFooter: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
    overflow: 'visible',
  },
  checkoutTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.md,
  },
  checkoutTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: T.colors.text.muted,
  },
  checkoutTotalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: T.colors.accent.primary,
  },
  checkoutHint: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    marginBottom: T.spacing.md,
  },
  checkoutPayBtn: {
    width: '100%',
    marginVertical: 0,
  },
});
