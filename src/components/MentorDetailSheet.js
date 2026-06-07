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
import CosmicButton from './CosmicButton';
import { UNIFIED_THEME } from '../unifiedTheme';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;

const SHEET_HEIGHT = 520;
const SHEET_BG = '#0f0e2a';
const PANEL_BG = '#161432';

function StatSegment({ icon, iconColor, value, label }) {
  return (
    <View style={styles.statSeg}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
        {value}
      </Text>
      <View style={styles.statLabelRow}>
        <MaterialIcons name={icon} size={12} color={iconColor} />
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
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
  }, [visible, slideAnim, backdropAnim]);

  if (!mentor) return null;

  const name = mentor.profiles?.name || 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = mentor.profiles?.avatar_url;
  const rating = mentor.rating != null && mentor.rating !== '' ? String(mentor.rating) : '—';
  const price = mentor.price_per_hour;
  const priceLabel = !price || price === 0 ? 'Free' : `₹${price}`;
  const expYears = mentor.experience_years ? `${mentor.experience_years}` : '—';
  const sessions = mentor.total_sessions ?? 0;
  const bio = mentor.bio || null;
  const spec = mentor.specialization || null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={20} color={C.text.primary} />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <View style={styles.header}>
            <LinearGradient colors={B.premiumGradient} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
              </View>
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{name}</Text>
              {spec ? (
                <Text style={styles.spec} numberOfLines={2}>
                  {spec}
                </Text>
              ) : null}
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={14} color={TEAL} />
                <Text style={styles.verifiedTxt}>Verified Mentor</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsBar}>
            <StatSegment icon="star" iconColor={GOLD} value={rating} label="Rating" />
            <View style={styles.statDivider} />
            <StatSegment icon="history-edu" iconColor={TEAL} value={String(sessions)} label="Sessions" />
            <View style={styles.statDivider} />
            <StatSegment icon="workspace-premium" iconColor={PURPLE_LINK} value={expYears} label="Exp" />
            <View style={styles.statDivider} />
            <StatSegment icon="payments" iconColor={GOLD} value={priceLabel} label="Rate" />
          </View>

          {bio ? (
            <View style={styles.bioWrap}>
              <Text style={styles.bioLabel}>About</Text>
              <Text style={styles.bioText}>{bio}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          <CosmicButton
            label="Profile"
            icon="person-outline"
            variant="goldOutline"
            size="compact"
            onPress={() => {
              onClose();
              onViewProfile(mentor);
            }}
            style={styles.profileBtnThemed}
          />

          <CosmicButton
            label="Book Session"
            icon="event"
            variant="nebula"
            onPress={() => {
              onClose();
              onBook(mentor);
            }}
            style={styles.bookBtnThemed}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,3,8,0.75)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(167,139,250,0.28)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginTop: T.spacing.md,
    marginBottom: T.spacing.sm,
    zIndex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: T.spacing.md,
    right: T.spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PANEL_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.lg,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: T.spacing.lg,
    alignItems: 'flex-start',
    marginBottom: T.spacing.lg,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary.void,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: PURPLE_LINK,
  },
  headerInfo: {
    flex: 1,
    paddingTop: 4,
  },
  name: {
    fontSize: 20,
    color: C.text.primary,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: T.spacing.xs,
  },
  spec: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: T.spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedTxt: {
    fontSize: 12,
    color: TEAL,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: PANEL_BG,
    paddingVertical: 11,
    paddingHorizontal: 4,
    marginBottom: T.spacing.lg,
  },
  statSeg: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text.primary,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.text.muted,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(167,139,250,0.18)',
    marginVertical: 6,
    alignSelf: 'stretch',
  },
  bioWrap: {
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    padding: T.spacing.md,
  },
  bioLabel: {
    fontSize: 11,
    color: PURPLE_LINK,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: T.spacing.sm,
  },
  bioText: {
    fontSize: 14,
    color: C.text.secondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167,139,250,0.22)',
    backgroundColor: SHEET_BG,
    zIndex: 1,
  },
  profileBtnThemed: { flex: 1, marginVertical: 0 },
  bookBtnThemed: { flex: 2, marginVertical: 0 },
});
