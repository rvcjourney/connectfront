import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';
import { formatDate, formatTime } from '../utils/dateHelpers';

const T = UNIFIED_THEME.colors;

const STATUS_COLORS = {
  pending: T.accent.warning,
  confirmed: T.accent.secondary,
  completed: T.accent.success,
  cancelled: T.text.muted,
  booked: T.accent.success,
  failed: T.text.muted,
};

const STATUS_ICONS = {
  pending: 'schedule',
  confirmed: 'check-circle',
  completed: 'done-all',
  cancelled: 'cancel',
  booked: 'event-available',
  failed: 'error',
};

/**
 * Session / booking row — flat cosmic panel (left status beam, square avatar, full-width CTA).
 */
export const BookingCard = ({
  booking,
  isMentor = false,
  showLearnerInfo = false,
  onPressJoin,
  onPressCancel,
  statusLabel = null,
}) => {
  const showLearnerDetails = isMentor || showLearnerInfo;

  const getOtherUserInfo = () => {
    if (showLearnerDetails) {
      return {
        name: booking.profiles?.name || 'Unknown Learner',
        avatar: booking.profiles?.avatar_url,
      };
    }
    return {
      name: booking.profiles?.name || 'Unknown Mentor',
      avatar: booking.profiles?.avatar_url,
    };
  };

  const otherUser = getOtherUserInfo();
  const avatarUrl = otherUser.avatar;
  const name = otherUser.name;

  const rawStatus = (statusLabel || booking.status || 'pending').toLowerCase();
  const displayStatus = statusLabel || booking.status || 'pending';
  const statusColor = STATUS_COLORS[rawStatus] || T.text.secondary;
  const statusIcon = STATUS_ICONS[rawStatus] || 'help';

  const date = booking.availability_slots?.date;
  const time = booking.availability_slots?.start_time;

  const canJoin =
    onPressJoin && (booking.status === 'pending' || booking.status === 'confirmed');
  const canCancel =
    onPressCancel && (booking.status === 'pending' || booking.status === 'confirmed');

  const statusTitle =
    typeof displayStatus === 'string'
      ? displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)
      : displayStatus;

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      <View style={styles.topRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons name="person" size={22} color={T.accent.secondary} />
          </View>
        )}

        <View style={styles.main}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="event" size={14} color={T.text.muted} />
            <Text style={styles.dateTime}>
              {date && time
                ? `${formatDate(date)} · ${formatTime(time)}`
                : 'Date pending'}
            </Text>
          </View>
        </View>

        <View style={styles.statusBlock}>
          <MaterialIcons name={statusIcon} size={16} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
            {statusTitle}
          </Text>
        </View>
      </View>

      {booking.message && isMentor ? (
        <View style={styles.goalStrip}>
          <View style={styles.goalAccent} />
          <View style={styles.goalBody}>
            <View style={styles.goalLabelRow}>
              <MaterialIcons name="menu-book" size={14} color={T.accent.secondary} />
              <Text style={styles.goalLabel}>Learning goal</Text>
            </View>
            <Text style={styles.goalText}>{booking.message}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {canJoin && onPressJoin ? (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={onPressJoin}
            activeOpacity={0.85}
          >
            <MaterialIcons name="videocam" size={18} color={T.accent.success} />
            <Text style={styles.joinBtnText}>
              {isMentor ? 'Start call' : 'Join call'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {canCancel && onPressCancel ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onPressCancel}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    padding: UNIFIED_THEME.spacing.md,
    borderWidth: 1,
    borderColor: T.border.light,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: UNIFIED_THEME.shadows.small,
      android: { elevation: 2 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.border.light,
  },
  avatarPlaceholder: {
    backgroundColor: T.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...UNIFIED_THEME.typography.labelMd,
    color: T.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTime: {
    ...UNIFIED_THEME.typography.bodySm,
    color: T.text.muted,
    flex: 1,
  },
  statusBlock: {
    alignItems: 'flex-end',
    maxWidth: '32%',
    gap: 2,
  },
  statusText: {
    ...UNIFIED_THEME.typography.labelSm,
    fontWeight: '700',
    textAlign: 'right',
  },
  goalStrip: {
    flexDirection: 'row',
    marginTop: UNIFIED_THEME.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border.light,
    paddingTop: UNIFIED_THEME.spacing.md,
  },
  goalAccent: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 40,
    backgroundColor: T.accent.secondary,
    borderRadius: 1,
    marginRight: UNIFIED_THEME.spacing.sm,
    opacity: 0.85,
  },
  goalBody: {
    flex: 1,
    minWidth: 0,
  },
  goalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  goalLabel: {
    ...UNIFIED_THEME.typography.labelSm,
    color: T.text.secondary,
    fontWeight: '700',
  },
  goalText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: T.text.primary,
    lineHeight: 20,
  },
  actions: {
    marginTop: UNIFIED_THEME.spacing.md,
    gap: UNIFIED_THEME.spacing.sm,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: UNIFIED_THEME.spacing.sm,
    paddingVertical: UNIFIED_THEME.spacing.sm + 2,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: T.accent.success,
  },
  joinBtnText: {
    ...UNIFIED_THEME.typography.labelMd,
    color: T.accent.success,
    fontWeight: '800',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.border.light,
    backgroundColor: T.component.input,
  },
  cancelBtnText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: T.text.secondary,
    fontWeight: '600',
  },
});
