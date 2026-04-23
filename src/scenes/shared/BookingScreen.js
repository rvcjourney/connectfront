import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import Button from '../../components/Button';
import { availabilityApi } from '../../api/availabilityApi';
import { paymentApi } from '../../api/paymentApi';
import { profileApi } from '../../api/profileApi';
import { scheduleSessionReminder, requestNotificationPermission } from '../../utils/sessionReminder';
import { calculateFees } from '../../utils/feeCalculator';
import { useAuth } from '../../hooks/useAuth';

const T = UNIFIED_THEME;

// ─── Date helpers ──────────────────────────────────────────────────────────
const getDaysInMonth  = d => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDisplayDate = (s) =>
  parseLocalDate(s).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

const isPastDate = (s) => {
  const d = parseLocalDate(s);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

// ─── Fee Breakdown Row ─────────────────────────────────────────────────────
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

const feeStyles = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label:  { ...T.typography.bodySm, color: T.colors.text.secondary },
  amount: { ...T.typography.bodySm, color: T.colors.text.secondary },
  bold:   { fontWeight: '700', color: T.colors.text.primary, fontSize: 14 },
  accent: { color: T.colors.accent.primary },
});

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function BookingScreen({ navigation, route }) {
  const { mentorId, mentorName } = route.params;
  const { profile } = useAuth();

  const [loading, setLoading]               = useState(true);
  const [paying, setPaying]                 = useState(false);
  const [currentDate, setCurrentDate]       = useState(new Date());
  const [selectedDate, setSelectedDate]     = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime]     = useState(null);
  const [mentorAvailability, setMentorAvailability] = useState({});
  const [timeSlotsForDate, setTimeSlotsForDate]     = useState([]);
  const [message, setMessage]               = useState('');
  const [pricePerHour, setPricePerHour]     = useState(0);
  const [feeConfig, setFeeConfig]           = useState(null);

  // ── Load mentor availability + price ──────────────────────────────────────
  const loadMentorData = useCallback(async () => {
    try {
      setLoading(true);
      const [availability, mentorProfile] = await Promise.all([
        availabilityApi.getAvailabilityForMentor(mentorId),
        profileApi.getMentorProfile(mentorId),
      ]);

      setPricePerHour(mentorProfile?.price_per_hour || 0);

      if (profile?.id) {
        const rule = await paymentApi.getFeeRule({
          learnerId: profile.id,
          mentorId,
        });
        setFeeConfig(
          rule
            ? {
                platformFeePercent: Number(rule.platform_fee_percent),
                gstPercent: Number(rule.gst_percent),
              }
            : null
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
          id:         slot.id,
          start_time: slot.start_time,
          end_time:   slot.end_time,
          is_booked:  slot.is_booked,
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

  useEffect(() => { loadMentorData(); }, [loadMentorData]);

  useEffect(() => {
    const slots = mentorAvailability[selectedDate] || [];
    setTimeSlotsForDate(slots.filter(s => !s.is_booked));
    setSelectedTime(null);
  }, [selectedDate, mentorAvailability]);

  const handleSelectDate = (dateStr) => {
    if (!(mentorAvailability[dateStr]?.length)) {
      Toast.show('No availability on this date');
      return;
    }
    setSelectedDate(dateStr);
  };

  // ── Fee calculation (derived from pricePerHour) ───────────────────────────
  const fees = pricePerHour > 0 ? calculateFees(pricePerHour, feeConfig || undefined) : null;

  // ── Payment flow ──────────────────────────────────────────────────────────
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

      // 1. Create Razorpay order (server-side via Edge Function)
      const order = await paymentApi.createOrder({
        mentorId,
        learnerId:         profile.id,
        slotId:            selectedTime.id,
        amountPaise:       fees.totalAmountPaise,
        mentorAmountPaise: fees.mentorAmountPaise,
        platformFeePaise:  fees.platformFeePaise,
      });

      // 2. Open Razorpay checkout
      const razorpayOptions = {
        description:  `1-on-1 session with ${mentorName}`,
        currency:     order.currency,
        key:          order.keyId,
        amount:       String(order.amount),
        order_id:     order.orderId,
        name:         'Connectiqo',
        prefill: {
          email:   profile.email  || '',
          contact: profile.phone  || '',
          name:    profile.name   || '',
        },
        theme: { color: T.colors.accent.primary },
      };

      const paymentData = await RazorpayCheckout.open(razorpayOptions);

      // 3. Verify + create booking atomically (server-side)
      await paymentApi.verifyAndBook({
        razorpayOrderId:    order.orderId,
        razorpayPaymentId:  paymentData.razorpay_payment_id,
        razorpaySignature:  paymentData.razorpay_signature,
        mentorId,
        learnerId:   profile.id,
        slotId:      selectedTime.id,
        message:     message.trim(),
        mentorAmount: fees.mentorAmount,
        platformFee:  fees.convenienceFee,
      });

      // 4. Schedule 15-min reminder for learner
      await requestNotificationPermission();
      await scheduleSessionReminder({
        bookingId:   selectedTime.id,
        sessionDate: selectedDate,
        sessionTime: selectedTime.start_time,
        mentorName,
        isMentor:    false,
      });

      Toast.show('Booking confirmed! Payment successful.');
      navigation.goBack();
    } catch (err) {
      // Razorpay cancellation returns a specific error code
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

  // ── Calendar ─────────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay   = getFirstDayOfMonth(currentDate);
  const days       = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1),
  );
  const monthYear  = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarWeeks = [];
  for (let i = 0; i < days.length; i += 7) {
    calendarWeeks.push(days.slice(i, i + 7));
  }

  return (
    <SafeScreen scrollable={true} padding={T.spacing.lg} hasBottomTabs={false}>

      {/* Header */}
      <View style={styles.headerCard}>
        <LinearGradient
          colors={['rgba(167,139,250,0.18)', 'rgba(94,234,212,0.1)', 'rgba(2,0,20,0.45)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.eyebrow}>Booking</Text>
        <Text style={styles.title}>Book with {mentorName}</Text>
        <Text style={styles.subtitle}>Select a date and available time slot</Text>
      </View>

      {/* Calendar */}
      <View style={styles.card}>
        <Text style={styles.sectionEyebrow}>Select Date</Text>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => {
              const p = new Date(currentDate);
              p.setMonth(p.getMonth() - 1);
              setCurrentDate(p);
            }}
          >
            <Text style={styles.navButton}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthYear}>{monthYear}</Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => {
              const n = new Date(currentDate);
              n.setMonth(n.getMonth() + 1);
              setCurrentDate(n);
            }}
          >
            <Text style={styles.navButton}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dayHeadersRow}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        {calendarWeeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (!day) return <View key={`e-${di}`} style={styles.emptyDay} />;
              const dayDate       = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateStr       = formatDate(dayDate);
              const isSelected    = selectedDate === dateStr;
              const isFuture      = !isPastDate(dateStr);
              const hasSlots      = (mentorAvailability[dateStr] || []).length > 0;
              const availableCount = (mentorAvailability[dateStr] || []).filter(s => !s.is_booked).length;
              const canBook       = isFuture && hasSlots;

              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  style={[
                    styles.dayButton,
                    isSelected  && styles.dayButtonSelected,
                    canBook     && styles.dayButtonWithAvailability,
                    !isFuture   && styles.dayButtonPast,
                  ]}
                  onPress={() => canBook && handleSelectDate(dateStr)}
                  disabled={!canBook}
                >
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected, !hasSlots && styles.dayNumberDisabled]}>
                    {day}
                  </Text>
                  {hasSlots && (
                    <Text style={[styles.slotCount, isSelected && styles.slotCountSelected]}>
                      {availableCount}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Time slots */}
      {timeSlotsForDate.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Select Time</Text>
          <Text style={styles.sectionTitle}>
            Available for {formatDisplayDate(selectedDate)}
          </Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlotsForDate.map((slot, idx) => {
              const fmt = t => t.substring(0, 5);
              const label = `${fmt(slot.start_time)}–${fmt(slot.end_time)}`;
              const isSel = selectedTime?.start_time === slot.start_time &&
                            selectedTime?.end_time   === slot.end_time;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.timeSlot, isSel && styles.timeSlotSelected]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text style={[styles.timeSlotText, isSel && styles.timeSlotTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedTime && (
            <View style={styles.selectedInfo}>
              <MaterialIcons name="check-circle" size={16} color={T.colors.text.onAccent} />
              <Text style={styles.selectedInfoText}>
                Slot: {selectedTime.start_time.substring(0, 5)}–{selectedTime.end_time.substring(0, 5)}
              </Text>
            </View>
          )}
        </View>
      )}

      {timeSlotsForDate.length === 0 && selectedDate && !loading && (
        <View style={styles.noSlotsCard}>
          <MaterialIcons name="event-busy" size={24} color={T.colors.text.muted} />
          <Text style={styles.noSlotsText}>
            No available slots for {formatDisplayDate(selectedDate)}
          </Text>
        </View>
      )}

      {Object.keys(mentorAvailability).length === 0 && !loading && (
        <View style={styles.noAvailCard}>
          <MaterialIcons name="sentiment-dissatisfied" size={28} color={T.colors.accent.secondary} />
          <Text style={styles.noAvailText}>This mentor hasn't set availability yet</Text>
          <Text style={styles.noAvailSub}>Please check back later or try another mentor</Text>
        </View>
      )}

      {/* Message / Goal */}
      {selectedTime && (
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Session Goal</Text>
          <Text style={styles.messageLabel}>What would you like to achieve?</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Share your learning goals or questions..."
            placeholderTextColor={T.colors.text.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      {/* ── Fee Breakdown ─────────────────────────────────────────────────── */}
      {selectedTime && fees && (
        <View style={styles.feeCard}>
          <View style={styles.feeHeader}>
            <MaterialIcons name="receipt-long" size={18} color={T.colors.accent.primary} />
            <Text style={styles.feeTitle}>Price Breakdown</Text>
          </View>

          <View style={styles.feeDivider} />

          <FeeRow label="Session fee (1 hr)"   amount={fees.mentorAmount}   />
          <FeeRow label={`Platform fee (${fees.platformFeePercent}%)`} amount={fees.platformBaseFee} />
          <FeeRow label={`GST (${fees.gstPercent}% on fee)`}   amount={fees.gstOnFee}       />

          <View style={styles.feeDivider} />

          <FeeRow
            label="Total payable"
            amount={fees.totalAmount}
            bold
            accent
          />

          <Text style={styles.feeNote}>
            ₹{fees.mentorAmount} goes directly to your mentor · ₹{fees.convenienceFee} convenience charge
          </Text>
        </View>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <Text style={styles.hint}>
        You can review and change your slot before paying.
      </Text>
      <View style={styles.actions}>
        <Button
          text="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          disabled={paying}
          style={styles.actionBtn}
        />
        <Button
          text={
            paying
              ? 'Processing...'
              : fees
              ? `Pay ₹${fees.totalAmount}`
              : 'Confirm Booking'
          }
          onPress={handlePay}
          disabled={!selectedTime || paying}
          style={styles.actionBtn}
        />
      </View>

      <LoadingOverlay
        visible={loading || paying}
        message={paying ? 'Processing payment...' : 'Loading availability...'}
      />
    </SafeScreen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  headerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.input,
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    overflow: 'hidden',
  },
  eyebrow: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: T.spacing.xs,
  },
  title: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    marginBottom: T.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
    textAlign: 'center',
  },

  card: {
    backgroundColor: T.colors.component.input,
    borderRadius: 12,
    padding: T.spacing.md,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.primary.light,
  },

  sectionEyebrow: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: T.spacing.xs,
    fontWeight: '700',
  },
  sectionTitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    fontWeight: '600',
    marginBottom: T.spacing.md,
  },

  // Calendar
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.md,
  },
  monthNavBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: T.colors.border.light,
    backgroundColor: T.colors.primary.light,
    justifyContent: 'center', alignItems: 'center',
  },
  monthYear: {
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    fontWeight: '600',
  },
  navButton: {
    fontSize: 24, color: T.colors.text.primary, fontWeight: 'bold', lineHeight: 26,
  },
  dayHeadersRow: {
    flexDirection: 'row', marginBottom: T.spacing.sm,
  },
  dayHeader: {
    flex: 1, textAlign: 'center',
    ...T.typography.bodySm,
    color: T.colors.text.secondary, fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: T.spacing.sm,
    justifyContent: 'space-between',
  },
  emptyDay:  { width: '13.5%', aspectRatio: 1 },
  dayButton: {
    width: '13.5%', aspectRatio: 1,
    backgroundColor: T.colors.primary.light,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    position: 'relative', opacity: 0.4,
  },
  dayButtonSelected: {
    backgroundColor: T.colors.accent.primary, opacity: 1,
    borderWidth: 2, borderColor: T.colors.primary.light,
  },
  dayButtonWithAvailability: {
    opacity: 1, borderWidth: 1, borderColor: T.colors.accent.secondary,
  },
  dayButtonPast: { opacity: 0.3, backgroundColor: T.colors.primary.light },
  dayNumber:         { ...T.typography.bodySm, color: T.colors.text.primary, fontWeight: '600' },
  dayNumberSelected: { color: T.colors.primary.light },
  dayNumberDisabled: { color: T.colors.text.muted },
  slotCount: {
    position: 'absolute', bottom: 2, right: 2,
    ...T.typography.bodySm, color: T.colors.accent.primary,
    backgroundColor: T.colors.component.input,
    borderRadius: 10, paddingHorizontal: 4, paddingVertical: 1,
    fontSize: 9, fontWeight: 'bold',
  },
  slotCountSelected: { color: T.colors.primary.light },

  // Time slots
  timeSlotsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: T.spacing.md, gap: T.spacing.sm,
  },
  timeSlot: {
    width: '32%', paddingVertical: T.spacing.md, paddingHorizontal: T.spacing.sm,
    marginVertical: T.spacing.xs,
    backgroundColor: T.colors.component.input, borderRadius: 8,
    borderWidth: 1, borderColor: T.colors.primary.light,
    justifyContent: 'center', alignItems: 'center',
  },
  timeSlotSelected: { backgroundColor: T.colors.accent.primary, borderColor: T.colors.primary.dark },
  timeSlotText:         { ...T.typography.bodySm, color: T.colors.text.primary, fontWeight: '600', fontSize: 11, textAlign: 'center' },
  timeSlotTextSelected: { color: T.colors.primary.light },
  selectedInfo: {
    backgroundColor: T.colors.accent.success,
    borderRadius: 8, paddingVertical: T.spacing.md, paddingHorizontal: T.spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: T.spacing.sm,
  },
  selectedInfoText: {
    ...T.typography.bodySm, color: T.colors.text.primary, textAlign: 'center', fontWeight: '600',
  },

  // No slots / no availability
  noSlotsCard: {
    backgroundColor: T.colors.component.input, borderRadius: 8,
    paddingVertical: T.spacing.lg, paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.lg, alignItems: 'center', gap: T.spacing.sm,
    borderWidth: 1, borderColor: T.colors.border.light,
  },
  noSlotsText: { ...T.typography.bodySm, color: T.colors.text.secondary, textAlign: 'center' },
  noAvailCard: {
    backgroundColor: T.colors.component.input, borderRadius: 8,
    paddingVertical: T.spacing.lg, paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.lg, borderLeftWidth: 4,
    borderLeftColor: T.colors.accent.secondary, alignItems: 'center',
  },
  noAvailText: { ...T.typography.bodyMd, color: T.colors.text.primary, textAlign: 'center', fontWeight: '600', marginTop: T.spacing.sm, marginBottom: T.spacing.sm },
  noAvailSub:  { ...T.typography.bodySm, color: T.colors.text.secondary, textAlign: 'center' },

  // Message
  messageLabel: {
    ...T.typography.bodyMd, color: T.colors.text.primary, fontWeight: '600', marginBottom: T.spacing.sm,
  },
  messageInput: {
    backgroundColor: T.colors.primary.light, color: T.colors.text.primary,
    paddingHorizontal: T.spacing.md, paddingVertical: T.spacing.lg,
    borderRadius: 8, borderWidth: 1, borderColor: T.colors.border.default,
    ...T.typography.bodySm, textAlignVertical: 'top',
  },

  // Fee card
  feeCard: {
    backgroundColor: T.colors.component.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.colors.accent.primary + '44',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
  },
  feeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: T.spacing.sm, marginBottom: T.spacing.md,
  },
  feeTitle: {
    ...T.typography.bodyMd, color: T.colors.text.primary, fontWeight: '700',
  },
  feeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.colors.border.light,
    marginVertical: T.spacing.sm,
  },
  feeNote: {
    ...T.typography.bodySm, color: T.colors.text.muted, marginTop: T.spacing.sm, lineHeight: 18,
  },

  // Actions
  hint: {
    ...T.typography.bodySm, color: T.colors.text.muted, textAlign: 'center', marginBottom: T.spacing.sm,
  },
  actions: {
    flexDirection: 'row', gap: T.spacing.md,
    marginBottom: T.spacing.lg,
  },
  actionBtn: { flex: 1 },
});
