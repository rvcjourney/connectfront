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

const T = UNIFIED_THEME;
const C = T.colors;

/**
 * Learner discover tile — flat panel (left accent, square avatar, no rings / pill CTAs).
 */
export function LearnerMentorCard({
  mentor,
  onBook,
  onViewProfile,
  onPress,
  showSessionCount = false,
}) {
  const name = mentor.profiles?.name || 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const rating =
    mentor.rating != null && mentor.rating !== '' ? String(mentor.rating) : '—';
  const price = mentor.price_per_hour ?? '0';
  const hasActions = Boolean(onBook && onViewProfile);

  const body = (
    <>
      <View style={styles.topRow}>
        <View style={styles.avatarTile}>
          {mentor.profiles?.avatar_url ? (
            <Image
              source={{ uri: mentor.profiles.avatar_url }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={[styles.avatarImg, styles.avatarPh]}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
        </View>
        <View style={styles.headMain}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={14} color={C.accent.warning} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.spec} numberOfLines={2}>
        {mentor.specialization || 'Specialist'}
      </Text>

      <Text style={styles.price}>
        ₹{price}
        <Text style={styles.priceUnit}>/hr</Text>
      </Text>

      {showSessionCount ? (
        <View style={styles.sessionsRow}>
          <MaterialIcons name="history-edu" size={14} color={C.text.muted} />
          <Text style={styles.sessionsText}>
            {mentor.total_sessions ?? 0} sessions
          </Text>
        </View>
      ) : null}

      {hasActions ? (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onBook(mentor)}
            activeOpacity={0.88}
            style={styles.bookBtn}
          >
            <Text style={styles.bookText}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => onViewProfile(mentor)}
            activeOpacity={0.85}
            accessibilityLabel="View profile"
          >
            <MaterialIcons name="person-outline" size={18} color={C.accent.secondary} />
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(mentor)}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${mentor.specialization || 'mentor'}`}
      >
        {body}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: 176,
    marginRight: T.spacing.md,
    backgroundColor: C.component.card,
    borderRadius: T.borderRadius.sm,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: C.border.light,
    borderLeftWidth: 3,
    borderLeftColor: C.accent.primary,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 3 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
    alignItems: 'flex-start',
  },
  avatarTile: {
    width: 52,
    height: 52,
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.primary.dark,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPh: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.component.input,
  },
  avatarLetter: {
    ...T.typography.headingSm,
    color: C.accent.secondary,
    fontWeight: '700',
    fontSize: 20,
  },
  headMain: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...T.typography.labelMd,
    color: C.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...T.typography.labelSm,
    color: C.text.secondary,
    fontWeight: '700',
  },
  spec: {
    ...T.typography.bodyXs,
    color: C.text.muted,
    marginBottom: T.spacing.sm,
    minHeight: 28,
    lineHeight: 16,
  },
  price: {
    ...T.typography.labelMd,
    color: C.accent.primary,
    fontWeight: '700',
    marginBottom: T.spacing.sm,
  },
  priceUnit: {
    ...T.typography.bodyXs,
    color: C.text.secondary,
    fontWeight: '600',
  },
  sessionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: T.spacing.sm,
  },
  sessionsText: {
    ...T.typography.bodyXs,
    color: C.text.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: T.spacing.xs,
    width: '100%',
    marginTop: 'auto',
  },
  bookBtn: {
    flex: 1,
    paddingVertical: T.spacing.sm,
    borderRadius: T.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: C.accent.success,
  },
  bookText: {
    ...T.typography.labelMd,
    color: C.accent.success,
    fontWeight: '800',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
