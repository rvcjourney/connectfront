import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';
import { formatDateTime, formatDate, formatTime } from '../utils/dateHelpers';

const STATUS_COLORS = {
  pending: UNIFIED_THEME.colors.accent.warning,
  confirmed: UNIFIED_THEME.colors.primary.light,
  completed: UNIFIED_THEME.colors.accent.success,
  cancelled: UNIFIED_THEME.colors.text.secondary,
  booked: UNIFIED_THEME.colors.text.success,
  failed: UNIFIED_THEME.colors.text.secondary,
};

const STATUS_ICONS = {
  pending: 'schedule',
  confirmed: 'check-circle',
  completed: 'done-all',
  cancelled: 'cancel',
  booked: 'check',
  failed: 'error',
};

export const BookingCard = ({
  booking,
  isMentor = false,
  showLearnerInfo = false,
  onPressJoin,
  onPressCancel,
  statusLabel = null,
}) => {
  // Show learner info when isMentor or when explicitly requested
  const showLearnerDetails = isMentor || showLearnerInfo;

  // Handle different data structures from API
  const getOtherUserInfo = () => {
    if (showLearnerDetails) {
      // For mentors viewing learner info
      return {
        name: booking.profiles?.name || 'Unknown Learner',
        avatar: booking.profiles?.avatar_url,
      };
    } else {
      // For learners viewing mentor info
      return {
        name: booking.profiles?.name || 'Unknown Mentor',
        avatar: booking.profiles?.avatar_url,
      };
    }
  };

  const otherUser = getOtherUserInfo();
  const avatarUrl = otherUser.avatar;
  const name = otherUser.name;

  const displayStatus = statusLabel || booking.status || 'pending';
  const statusColor = STATUS_COLORS[displayStatus] || UNIFIED_THEME.colors.text.secondary;
  const statusIcon = STATUS_ICONS[displayStatus] || 'help';

  const date = booking.availability_slots?.date;
  const time = booking.availability_slots?.start_time;

  // Can join if there's a join handler AND (status is pending/confirmed for mentors OR status is confirmed for learners)
  const canJoin = onPressJoin && (booking.status === 'pending' || booking.status === 'confirmed');
  const canCancel = onPressCancel && (booking.status === 'pending' || booking.status === 'confirmed');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons
              name="person"
              size={24}
              color={UNIFIED_THEME.colors.primary.light}
            />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.dateTime}>
            {date && time ? `${formatDate(date)} at ${formatTime(time)}` : 'Date pending'}
          </Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <MaterialIcons name={statusIcon} size={14} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
          </Text>
        </View>
      </View>

      {booking.message && isMentor && (
        <View style={styles.messageSection}>
          <Text style={styles.messageLabel}>📝 Learning Goal:</Text>
          <Text style={styles.messageText}>{booking.message}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {canJoin && onPressJoin && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={onPressJoin}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="videocam"
              size={16}
              color={UNIFIED_THEME.colors.accent.success}
            />
            <Text style={styles.joinButtonText}>
              {isMentor ? 'Start Call' : 'Join Call'}
            </Text>
          </TouchableOpacity>
        )}

        {/* {canCancel && onPressCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onPressCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )} */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    padding: UNIFIED_THEME.spacing.md,
    marginHorizontal: UNIFIED_THEME.spacing.md,
    marginVertical: UNIFIED_THEME.spacing.sm,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: UNIFIED_THEME.spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateTime: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    ...UNIFIED_THEME.typography.bodySm,
    fontWeight: '600',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: UNIFIED_THEME.spacing.sm,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  cancelButton: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.text.secondary,
  },
  cancelButtonText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    fontWeight: '600',
  },
  messageSection: {
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: 8,
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  messageLabel: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  messageText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
    lineHeight: 18,
  },
});
