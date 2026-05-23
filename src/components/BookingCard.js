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
import { formatDate, formatTime, formatDateForDisplay } from '../utils/dateHelpers';

const T = UNIFIED_THEME.colors;

const STATUS_COLORS = {
  pending: T.accent.warning,
  confirmed: T.accent.secondary,
  completed: T.accent.success,
  cancelled: T.text.muted,
  booked: T.accent.success,
  failed: T.text.muted,
  expired: T.text.muted,
  live: T.accent.secondary,
  done: T.accent.success,
};

const STATUS_ICONS = {
  pending: 'schedule',
  confirmed: 'check-circle',
  completed: 'done-all',
  cancelled: 'cancel',
  booked: 'event-available',
  failed: 'error',
  expired: 'history-toggle-off',
  live: 'fiber-manual-record',
  done: 'done-all',
};

/**
 * Session / booking row — flat cosmic panel (left status beam, square avatar, full-width CTA).
 */
export const BookingCard = ({
  booking,
  isMentor = false,
  showLearnerInfo = false,
  compact = false,
  onPressJoin,
  onPressCancel,
  onPressRecording = null,
  onPressRate = null,
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

  const rawStatus = (statusLabel || booking.status || 'pending')
    .toLowerCase()
    .replace(/\s+/g, '');
  const displayStatus = statusLabel || booking.status || 'pending';
  const statusColor = STATUS_COLORS[rawStatus] || T.text.secondary;
  const statusIcon = STATUS_ICONS[rawStatus] || 'help';

  const date = booking.availability_slots?.date;
  const time = booking.availability_slots?.start_time;
  const dateLabel =
    date && time
      ? compact
        ? `${formatDateForDisplay(date)} · ${formatTime(time)}`
        : `${formatDate(date)} · ${formatTime(time)}`
      : null;

  const canJoin =
    onPressJoin && (booking.status === 'pending' || booking.status === 'confirmed');
  const canCancel =
    onPressCancel && (booking.status === 'pending' || booking.status === 'confirmed');
  const canViewRecording = !!onPressRecording;

  const statusTitle =
    typeof displayStatus === 'string'
      ? displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)
      : displayStatus;

  const hasActions = canJoin || canCancel || canViewRecording || onPressRate;

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { borderLeftColor: statusColor },
      ]}
    >
      <View style={styles.topRow}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatar, compact && styles.avatarCompact]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              compact && styles.avatarCompact,
            ]}
          >
            <MaterialIcons
              name="person"
              size={compact ? 20 : 22}
              color={T.accent.secondary}
            />
          </View>
        )}

        <View style={styles.main}>
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
            {name}
          </Text>
          {dateLabel ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={13} color={T.text.muted} />
              <Text style={styles.dateTime} numberOfLines={1}>
                {dateLabel}
              </Text>
            </View>
          ) : (
            <View style={styles.metaRow}>
              <MaterialIcons name="event-busy" size={13} color={T.text.muted} />
              <Text style={styles.dateTime}>—</Text>
            </View>
          )}
        </View>

        <View style={[styles.statusPill, { borderColor: `${statusColor}44` }]}>
          <MaterialIcons name={statusIcon} size={14} color={statusColor} />
          <Text
            style={[styles.statusText, compact && styles.statusTextCompact, { color: statusColor }]}
            numberOfLines={1}
          >
            {statusTitle}
          </Text>
        </View>
      </View>

      {booking.message && isMentor ? (
        <View style={[styles.goalStrip, compact && styles.goalStripCompact]}>
          <MaterialIcons name="chat-bubble-outline" size={14} color={T.accent.secondary} />
          <Text style={styles.goalText} numberOfLines={2}>
            {booking.message}
          </Text>
        </View>
      ) : null}

      {hasActions ? (
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {canJoin && onPressJoin ? (
            <TouchableOpacity
              style={[styles.joinBtn, compact && styles.actionBtnCompact]}
              onPress={onPressJoin}
              activeOpacity={0.85}
            >
              <MaterialIcons name="videocam" size={20} color={T.accent.success} />
              {compact ? (
                <Text style={styles.joinBtnTextCompact}>Start</Text>
              ) : (
                <Text style={styles.joinBtnText}>{isMentor ? 'Start' : 'Join'}</Text>
              )}
            </TouchableOpacity>
          ) : null}
          {canCancel && onPressCancel ? (
            <TouchableOpacity
              style={[styles.cancelBtn, compact && styles.actionBtnCompact]}
              onPress={onPressCancel}
              activeOpacity={0.85}
            >
              <MaterialIcons name="close" size={18} color={T.text.secondary} />
              {!compact ? <Text style={styles.cancelBtnText}>Cancel</Text> : null}
            </TouchableOpacity>
          ) : null}
          {canViewRecording ? (
            <TouchableOpacity
              style={[styles.recordingBtn, compact && styles.actionBtnCompact]}
              onPress={onPressRecording}
              activeOpacity={0.85}
            >
              <MaterialIcons name="play-circle-filled" size={20} color={T.accent.secondary} />
              {compact ? (
                <Text style={styles.recordingBtnTextCompact}>Replay</Text>
              ) : (
                <Text style={styles.recordingBtnText}>Replay</Text>
              )}
            </TouchableOpacity>
          ) : null}
          {onPressRate ? (
            <TouchableOpacity
              style={[styles.rateBtn, compact && styles.actionBtnCompact]}
              onPress={onPressRate}
              activeOpacity={0.85}
            >
              <MaterialIcons name="star-outline" size={18} color={T.accent.warning} />
              {!compact ? <Text style={styles.rateBtnText}>Rate</Text> : null}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    borderWidth: 1,
    borderColor: T.border.light,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: UNIFIED_THEME.shadows.small,
      android: { elevation: 2 },
    }),
  },
  cardCompact: {
    padding: UNIFIED_THEME.spacing.sm + 2,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
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
  avatarCompact: {
    width: 44,
    height: 44,
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
  nameCompact: {
    fontSize: 14,
    marginBottom: 2,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    maxWidth: '36%',
  },
  statusText: {
    ...UNIFIED_THEME.typography.labelSm,
    fontWeight: '700',
  },
  statusTextCompact: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  goalStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: UNIFIED_THEME.spacing.sm,
    marginTop: UNIFIED_THEME.spacing.sm,
    paddingTop: UNIFIED_THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border.light,
  },
  goalStripCompact: {
    marginTop: UNIFIED_THEME.spacing.xs,
    paddingTop: UNIFIED_THEME.spacing.xs,
  },
  goalText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: T.text.secondary,
    lineHeight: 18,
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    marginTop: UNIFIED_THEME.spacing.md,
    gap: UNIFIED_THEME.spacing.sm,
  },
  actionsCompact: {
    marginTop: UNIFIED_THEME.spacing.sm,
  },
  actionBtnCompact: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  joinBtn: {
    flex: 1,
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
  joinBtnTextCompact: {
    ...UNIFIED_THEME.typography.labelSm,
    color: T.accent.success,
    fontWeight: '800',
  },
  recordingBtnTextCompact: {
    ...UNIFIED_THEME.typography.labelSm,
    color: T.accent.secondary,
    fontWeight: '800',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  recordingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: UNIFIED_THEME.spacing.sm,
    paddingVertical: UNIFIED_THEME.spacing.sm + 2,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: T.accent.secondary,
  },
  recordingBtnText: {
    ...UNIFIED_THEME.typography.labelMd,
    color: T.accent.secondary,
    fontWeight: '800',
  },
  rateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.accent.warning,
  },
  rateBtnText: {
    ...UNIFIED_THEME.typography.labelMd,
    color: UNIFIED_THEME.colors.accent.warning,
    fontWeight: '700',
  },
});
