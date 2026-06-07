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
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;

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
          <MaterialIcons name="star" size={10} color={GOLD} />
          <Text style={styles.ratingBadgeTxt}>{rating}</Text>
        </View>
      ) : null}

      {/* Bottom gradient info strip */}
      <LinearGradient
        colors={['transparent', 'rgba(3,2,12,0.65)', 'rgba(3,2,12,0.97)']}
        style={styles.strip}
        pointerEvents="none"
      >
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {spec ? (
          <Text style={styles.spec} numberOfLines={1}>{spec}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <MaterialIcons name="history-edu" size={10} color={C.text.muted} />
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  img: {
    ...StyleSheet.absoluteFillObject,
  },
  imgPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: S.accentViolet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 52,
    fontWeight: '700',
    color: PURPLE_LINK,
    opacity: 0.45,
  },
  ratingBadge: {
    position: 'absolute',
    top: T.spacing.xs,
    right: T.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: S.accentGold,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.25)',
  },
  ratingBadgeTxt: {
    fontSize: 10,
    color: GOLD,
    fontWeight: '700',
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
    color: C.text.primary,
    fontWeight: '800',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  spec: {
    fontSize: 10,
    color: GOLD,
    fontWeight: '700',
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
    color: C.text.muted,
    fontWeight: '600',
  },
});
