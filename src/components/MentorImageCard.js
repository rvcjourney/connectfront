import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

const T = UNIFIED_THEME;
const C = T.colors;

export function MentorImageCard({ mentor, onPress, style }) {
  const name       = mentor.profiles?.name || 'Unknown';
  const initial    = name.charAt(0).toUpperCase();
  const avatarUrl  = mentor.profiles?.avatar_url;
  const rating     = mentor.rating != null && mentor.rating !== '' ? String(mentor.rating) : null;
  const sessions   = mentor.total_sessions ?? 0;
  const spec       = mentor.specialization || null;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(mentor)}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${spec || 'mentor'}`}
    >
      {/* Full-bleed photo */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={styles.imgPlaceholder}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
      )}

      {/* Top-right: rating badge */}
      {rating ? (
        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={10} color={C.accent.warning} />
          <Text style={styles.ratingBadgeTxt}>{rating}</Text>
        </View>
      ) : null}

      {/* Bottom gradient info strip */}
      <LinearGradient
        colors={['transparent', 'rgba(2,0,20,0.65)', 'rgba(2,0,20,0.97)']}
        style={styles.strip}
        pointerEvents="none"
      >
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {spec ? (
          <Text style={styles.spec} numberOfLines={1}>{spec}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <MaterialIcons name="history-edu" size={10} color="rgba(255,255,255,0.5)" />
          <Text style={styles.sessions}>{sessions} sessions</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    height: 172,
    borderRadius: T.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: C.component.card,
    borderWidth: 1,
    borderColor: C.border.light,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  img: {
    ...StyleSheet.absoluteFillObject,
  },
  imgPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 52,
    fontWeight: '700',
    color: 'rgba(94,234,212,0.3)',
  },
  ratingBadge: {
    position: 'absolute',
    top: T.spacing.xs,
    right: T.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(2,0,20,0.75)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.25)',
  },
  ratingBadgeTxt: {
    ...T.typography.labelSm,
    color: C.accent.warning,
    fontWeight: '700',
    fontSize: 10,
  },
  strip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: T.spacing.sm,
    paddingTop: T.spacing.xxl,
    paddingBottom: T.spacing.sm,
  },
  name: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  spec: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    lineHeight: 14,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sessions: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
});
