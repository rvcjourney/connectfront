import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

const T = UNIFIED_THEME;
const C = T.colors;

const SHEET_HEIGHT = 520;

function StatPill({ icon, value, label, color }) {
  return (
    <View style={styles.statPill}>
      <MaterialIcons name={icon} size={16} color={color || C.accent.secondary} />
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function MentorDetailSheet({ mentor, visible, onClose, onBook, onViewProfile }) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!mentor) return null;

  const name        = mentor.profiles?.name || 'Unknown';
  const initial     = name.charAt(0).toUpperCase();
  const avatarUrl   = mentor.profiles?.avatar_url;
  const rating      = mentor.rating != null && mentor.rating !== '' ? String(mentor.rating) : '—';
  const price       = mentor.price_per_hour;
  const priceLabel  = !price || price === 0 ? 'Free' : `₹${price}/hr`;
  const expYears    = mentor.experience_years ? `${mentor.experience_years} yrs` : '—';
  const sessions    = mentor.total_sessions ?? 0;
  const bio         = mentor.bio || null;
  const spec        = mentor.specialization || null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropAnim },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="close" size={20} color={C.text.secondary} />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Avatar + name header */}
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={['rgba(94,234,212,0.2)', 'rgba(167,139,250,0.2)']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{name}</Text>
              {spec ? (
                <Text style={styles.spec} numberOfLines={2}>{spec}</Text>
              ) : null}
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={14} color={C.accent.secondary} />
                <Text style={styles.verifiedTxt}>Verified Mentor</Text>
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatPill icon="star" value={rating} label="Rating" color={C.accent.warning} />
            <View style={styles.statDivider} />
            <StatPill icon="history-edu" value={sessions} label="Sessions" />
            <View style={styles.statDivider} />
            <StatPill icon="workspace-premium" value={expYears} label="Exp" color={C.accent.primary} />
            <View style={styles.statDivider} />
            <StatPill icon="payments" value={priceLabel} label="Rate" color={C.accent.primary} />
          </View>

          {/* Bio */}
          {bio ? (
            <View style={styles.bioWrap}>
              <Text style={styles.bioLabel}>About</Text>
              <Text style={styles.bioText}>{bio}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => { onClose(); onViewProfile(mentor); }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person-outline" size={18} color={C.accent.secondary} />
            <Text style={styles.profileBtnTxt}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => { onClose(); onBook(mentor); }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="event" size={18} color={C.primary.void} />
            <Text style={styles.bookBtnTxt}>Book Session</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,0,20,0.72)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.primary.dark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.border.light,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border.default,
    alignSelf: 'center',
    marginTop: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  closeBtn: {
    position: 'absolute',
    top: T.spacing.md,
    right: T.spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.component.input,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border.light,
  },
  scrollContent: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: T.spacing.lg,
    alignItems: 'flex-start',
    marginBottom: T.spacing.lg,
  },
  avatarWrap: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(94,234,212,0.3)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: C.accent.secondary,
  },
  headerInfo: {
    flex: 1,
    paddingTop: 4,
  },
  name: {
    ...T.typography.headingSm,
    color: C.text.primary,
    fontWeight: '700',
    marginBottom: T.spacing.xs,
  },
  spec: {
    ...T.typography.bodySm,
    color: C.text.secondary,
    lineHeight: 20,
    marginBottom: T.spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedTxt: {
    ...T.typography.labelSm,
    color: C.accent.secondary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.component.input,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.border.light,
    paddingVertical: T.spacing.md,
    paddingHorizontal: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    ...T.typography.labelMd,
    color: C.accent.secondary,
    fontWeight: '700',
  },
  statLabel: {
    ...T.typography.labelSm,
    color: C.text.muted,
    fontSize: 10,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: C.border.light,
  },
  bioWrap: {
    backgroundColor: C.component.input,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.border.light,
    padding: T.spacing.md,
  },
  bioLabel: {
    ...T.typography.labelSm,
    color: C.accent.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: T.spacing.sm,
  },
  bioText: {
    ...T.typography.bodyMd,
    color: C.text.secondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border.light,
  },
  profileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.accent.secondary,
    backgroundColor: 'rgba(94,234,212,0.08)',
  },
  profileBtnTxt: {
    ...T.typography.labelMd,
    color: C.accent.secondary,
    fontWeight: '700',
  },
  bookBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    borderRadius: T.borderRadius.md,
    backgroundColor: C.accent.secondary,
  },
  bookBtnTxt: {
    ...T.typography.labelMd,
    color: C.primary.void,
    fontWeight: '800',
  },
});
