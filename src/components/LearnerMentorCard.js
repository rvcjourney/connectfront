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
  fullWidth = false,
}) {
  const name = mentor.profiles?.name || 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const rating = mentor.rating != null && mentor.rating !== '' ? String(mentor.rating) : null;
  const price = mentor.price_per_hour;
  const priceLabel = !price || price === 0 ? 'Free' : `₹${price}`;
  const expYears = mentor.experience_years;
  const sessions = mentor.total_sessions ?? 0;
  const hasActions = Boolean(onBook && onViewProfile);

  const body = (
    <>
      <View style={styles.topRow}>
        <View style={styles.avatarTile}>
          {mentor.profiles?.avatar_url ? (
            <Image source={{ uri: mentor.profiles.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarImg, styles.avatarPh]}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
        </View>
        <View style={styles.headMain}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <View style={styles.badgeRow}>
            {rating ? (
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={11} color={C.accent.warning} />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
            ) : null}
            {expYears ? (
              <View style={styles.expBadge}>
                <Text style={styles.expText}>{expYears}yr</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles.spec} numberOfLines={2}>
        {mentor.specialization || 'Specialist'}
      </Text>

      <View style={styles.priceRow}>
        <Text style={[styles.price, !price && styles.priceFree]}>{priceLabel}</Text>
        {price ? <Text style={styles.priceUnit}>/hr</Text> : null}
      </View>

      <View style={styles.metaRow}>
        <MaterialIcons name="history-edu" size={12} color={C.text.muted} />
        <Text style={styles.metaText}>{sessions} sessions</Text>
      </View>

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

  return <View style={[styles.card, fullWidth && styles.cardFullWidth]}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: 176,
    backgroundColor: C.component.card,
    borderRadius: T.borderRadius.md,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: C.border.light,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(94,234,212,0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  cardFullWidth: {
    width: '100%',
    flex: undefined,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(94,234,212,0.25)',
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
    fontSize: 18,
  },
  headMain: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...T.typography.labelMd,
    color: C.text.primary,
    fontWeight: '700',
    marginBottom: 5,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(240,216,117,0.12)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: {
    ...T.typography.labelSm,
    color: C.accent.warning,
    fontWeight: '700',
    fontSize: 11,
  },
  expBadge: {
    backgroundColor: 'rgba(94,234,212,0.1)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  expText: {
    ...T.typography.labelSm,
    color: C.accent.secondary,
    fontWeight: '700',
    fontSize: 11,
  },
  spec: {
    ...T.typography.bodyXs,
    color: C.text.muted,
    marginBottom: T.spacing.sm,
    minHeight: 26,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: T.spacing.xs,
  },
  price: {
    ...T.typography.labelMd,
    color: C.accent.primary,
    fontWeight: '800',
  },
  priceFree: {
    color: C.accent.secondary,
  },
  priceUnit: {
    ...T.typography.bodyXs,
    color: C.text.secondary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: T.spacing.sm,
  },
  metaText: {
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
    backgroundColor: C.accent.secondary,
  },
  bookText: {
    ...T.typography.labelMd,
    color: C.primary.void,
    fontWeight: '800',
    fontSize: 13,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
