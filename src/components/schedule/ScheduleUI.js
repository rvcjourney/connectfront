import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;

const GLASS_BG = 'rgba(255,255,255,0.07)';
const GLASS_BORDER = 'rgba(167,139,250,0.22)';
const GLASS_BORDER_SOFT = 'rgba(255,255,255,0.14)';

export const scheduleStyles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.md,
  },
  topBarSide: { width: 40 },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: {
    fontSize: 15,
    color: C.text.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  topBarSub: {
    fontSize: 11,
    color: PURPLE_LINK,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  heroBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    overflow: 'hidden',
    marginBottom: T.spacing.md,
    padding: T.spacing.lg,
    ...Platform.select({ ios: T.shadows.medium, android: { elevation: 6 } }),
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.md },
  heroBody: { flex: 1, minWidth: 0 },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE_LINK,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text.primary,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.borderRadius.chip,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  metaPillText: { fontSize: 10, fontWeight: '700', color: C.text.primary },

  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: PURPLE_LINK },

  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    paddingVertical: 10,
    paddingHorizontal: T.spacing.md,
    marginBottom: T.spacing.lg,
    overflow: 'hidden',
  },
  previewScroll: { gap: 8, paddingRight: 8 },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: T.borderRadius.chip,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewChipReady: {
    backgroundColor: S.accentSuccess,
    borderColor: B.successBorder,
  },
  previewChipWarning: {
    backgroundColor: S.accentWarning,
    borderColor: B.warningBorder,
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text.primary,
    maxWidth: 140,
  },

  sectionBlock: { marginBottom: T.spacing.lg },
  sectionBlockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    marginBottom: T.spacing.md,
  },
  sectionStepBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionAccentGold: { backgroundColor: S.accentGold, borderColor: 'rgba(240,216,117,0.25)' },
  sectionAccentTeal: { backgroundColor: S.accentTeal, borderColor: 'rgba(94,234,212,0.25)' },
  sectionAccentViolet: { backgroundColor: S.accentViolet, borderColor: 'rgba(167,139,250,0.35)' },
  sectionStepNum: { fontSize: 13, fontWeight: '900', color: C.text.primary },
  sectionBlockTitles: { flex: 1 },
  sectionBlockTitle: { fontSize: 15, fontWeight: '800', color: C.text.primary },
  sectionBlockSub: { fontSize: 12, color: C.text.muted, marginTop: 2 },

  calendarPanel: {
    backgroundColor: GLASS_BG,
    borderRadius: 16,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.md,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(12,12,40,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavBtnDisabled: { opacity: 0.35 },
  monthPill: {
    paddingHorizontal: T.spacing.lg,
    paddingVertical: 8,
    borderRadius: T.borderRadius.chip,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  monthYear: { fontSize: 15, color: C.text.primary, fontWeight: '800' },
  dayHeadersRow: { flexDirection: 'row', marginBottom: T.spacing.sm },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: C.text.muted,
    fontWeight: '700',
  },
  weekRow: { flexDirection: 'row', marginBottom: 6, justifyContent: 'space-between' },
  emptyDay: { width: '13.2%', aspectRatio: 1 },
  dayCellWrap: { width: '13.2%', aspectRatio: 1 },
  dayButton: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.35,
  },
  dayButtonAvailable: { opacity: 1, borderColor: S.dayAvailableBorder },
  dayButtonPast: { opacity: 0.2 },
  dayButtonPressed: { opacity: 0.85 },
  dayButtonSelected: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: B.primaryBorder,
  },
  dayNumber: { fontSize: 14, color: C.text.primary, fontWeight: '700' },
  dayNumberSelected: { color: B.primaryText, fontWeight: '800' },
  dayNumberDisabled: { color: C.text.muted },
  slotDot: {
    position: 'absolute',
    bottom: 3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: S.slotDot,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  slotDotSelected: { backgroundColor: S.slotDotSelected },
  slotDotText: { fontSize: 8, fontWeight: '800', color: TEAL },
  slotDotTextSelected: { color: B.primaryText },

  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: GLASS_BORDER,
    backgroundColor: S.checkoutBar,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
  },
});

export function ScheduleSectionBlock({ step, title, subtitle, children, accent = 'gold' }) {
  const accentStyle =
    accent === 'teal'
      ? scheduleStyles.sectionAccentTeal
      : accent === 'violet'
        ? scheduleStyles.sectionAccentViolet
        : scheduleStyles.sectionAccentGold;

  return (
    <View style={scheduleStyles.sectionBlock}>
      <View style={scheduleStyles.sectionBlockHead}>
        <View style={[scheduleStyles.sectionStepBadge, accentStyle]}>
          <Text style={scheduleStyles.sectionStepNum}>{step}</Text>
        </View>
        <View style={scheduleStyles.sectionBlockTitles}>
          <Text style={scheduleStyles.sectionBlockTitle}>{title}</Text>
          {subtitle ? <Text style={scheduleStyles.sectionBlockSub}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function SchedulePreviewBar({ children }) {
  return (
    <View style={scheduleStyles.previewBar}>
      <LinearGradient
        colors={S.previewGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <MaterialIcons name="auto-awesome" size={16} color={GOLD} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={scheduleStyles.previewScroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function SchedulePreviewChip({ icon, label, variant = 'default', textStyle }) {
  const chipStyle =
    variant === 'ready'
      ? scheduleStyles.previewChipReady
      : variant === 'warning'
        ? scheduleStyles.previewChipWarning
        : scheduleStyles.previewChip;

  return (
    <View style={chipStyle}>
      {icon}
      <Text style={[scheduleStyles.previewChipText, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function ScheduleDayCell({
  day,
  isSelected,
  enabled,
  hasSlots,
  slotCount,
  muteLabel,
  onPress,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.08, friction: 4, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [isSelected, scale]);

  const inner = (
    <>
      <Text
        style={[
          scheduleStyles.dayNumber,
          isSelected && scheduleStyles.dayNumberSelected,
          muteLabel && scheduleStyles.dayNumberDisabled,
        ]}
      >
        {day}
      </Text>
      {hasSlots && slotCount > 0 ? (
        <View style={[scheduleStyles.slotDot, isSelected && scheduleStyles.slotDotSelected]}>
          <Text
            style={[
              scheduleStyles.slotDotText,
              isSelected && scheduleStyles.slotDotTextSelected,
            ]}
          >
            {slotCount}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (isSelected) {
    return (
      <View style={scheduleStyles.dayCellWrap}>
        <Pressable onPress={onPress} disabled={!enabled}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <LinearGradient
              colors={B.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={scheduleStyles.dayButtonSelected}
            >
              {inner}
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={scheduleStyles.dayCellWrap}>
      <Pressable
        onPress={onPress}
        disabled={!enabled}
        style={({ pressed }) => [
          scheduleStyles.dayButton,
          enabled && scheduleStyles.dayButtonAvailable,
          !enabled && scheduleStyles.dayButtonPast,
          pressed && enabled && scheduleStyles.dayButtonPressed,
        ]}
      >
        {inner}
      </Pressable>
    </View>
  );
}

export function ScheduleHeroBanner({ initial, name, label, children }) {
  return (
    <View style={scheduleStyles.heroBanner}>
      <LinearGradient
        colors={S.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={scheduleStyles.heroRow}>
        <LinearGradient colors={B.premiumGradient} style={scheduleStyles.avatarRing}>
          <View style={scheduleStyles.avatarInner}>
            <Text style={scheduleStyles.avatarText}>{initial}</Text>
          </View>
        </LinearGradient>
        <View style={scheduleStyles.heroBody}>
          <Text style={scheduleStyles.heroLabel}>{label}</Text>
          <Text style={scheduleStyles.heroName} numberOfLines={1}>
            {name}
          </Text>
          {children}
        </View>
      </View>
    </View>
  );
}

export { T as scheduleTheme, B as scheduleButtons, S as scheduleSurface, PURPLE_LINK, GOLD, TEAL };
