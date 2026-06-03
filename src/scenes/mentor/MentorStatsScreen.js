import { SafeScreen } from '../../components/SafeScreen';
import { useEffect, useState, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, RefreshControl,
  TouchableOpacity, Animated, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { useAuth } from '../../hooks/useAuth';
import { earningsApi } from '../../api/earningsApi';
import { profileApi } from '../../api/profileApi';
import { videoApi } from '../../api/videoApi';
import { formatCurrency } from '../../utils/formatCurrency';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;

function SkeletonBone({ style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });
  return <Animated.View style={[{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: T.borderRadius.sm }, style, { opacity }]} />;
}

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

export default function MentorStatsScreen({ onClose }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [mentorProfile, setMentorProfile] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [rating, setRating] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const [mentorData, earnings, subCount] = await Promise.all([
        profileApi.getMentorProfile(profile.id).catch(() => null),
        earningsApi.getTotalEarnings(profile.id).catch(() => 0),
        videoApi.getMentorActiveSubscriberCount(profile.id).catch(() => 0),
      ]);
      setMentorProfile(mentorData);
      setRating(mentorData?.rating || 0);
      setTotalEarnings(earnings || 0);
      setTotalSessions(mentorData?.total_sessions || 0);
      setSubscriberCount(Number.isFinite(Number(subCount)) ? Math.max(0, Math.floor(Number(subCount))) : 0);
    } catch {
      Toast.show('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const PROFILE_FIELDS = [
    { key: 'photo', label: 'Profile photo', done: Boolean(profile?.avatar_url) },
    { key: 'name', label: 'Full name', done: Boolean(profile?.name?.trim()) },
    { key: 'specialization', label: 'Specialization', done: Boolean(mentorProfile?.specialization?.trim()) },
    { key: 'bio', label: 'Bio', done: Boolean(mentorProfile?.bio?.trim()) },
    { key: 'price', label: 'Session rate', done: Boolean(mentorProfile?.price_per_hour > 0) },
    { key: 'experience', label: 'Years of experience', done: Boolean(mentorProfile?.experience_years > 0) },
  ];
  const completedCount = PROFILE_FIELDS.filter(f => f.done).length;
  const completionPct = Math.round((completedCount / PROFILE_FIELDS.length) * 100);
  const isComplete = completionPct === 100;
  const missing = PROFILE_FIELDS.filter(f => !f.done);
  const firstName = profile?.name?.split(/\s+/)[0] || 'there';
  const ratingDisplay = typeof rating === 'number' ? rating.toFixed(1) : String(rating);

  return (
    <SafeScreen
      scrollable
      padding={T.spacing.lg}
      includeTopInset={false}
      hasBottomTabs={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TEAL} />
      }
    >
      <TouchableOpacity
        style={[styles.backBtn, { marginTop: insets.top }]}
        onPress={onClose ?? (() => navigation.goBack())}
        activeOpacity={0.8}
      >
        <MaterialIcons name="arrow-back" size={22} color={C.text.primary} />
      </TouchableOpacity>

      {loading && !refreshing ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          <SkeletonBone style={{ height: 200, borderRadius: 16 }} />
          <SkeletonBone style={{ height: 72 }} />
          <SkeletonBone style={{ height: 120 }} />
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <LinearGradient
              colors={S.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconRing}>
                <LinearGradient colors={B.premiumGradient} style={styles.heroIconRingGrad}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url, cache: 'reload' }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarImg, styles.avatarPh]}>
                      <Text style={styles.avatarLetter}>{profile?.name?.charAt(0).toUpperCase() || '?'}</Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
              <View style={styles.heroBody}>
                <View style={styles.heroBadge}>
                  <MaterialIcons name="school" size={13} color={TEAL} />
                  <Text style={styles.heroBadgeText}>Mentor</Text>
                </View>
                <Text style={styles.heroEyebrow}>Dashboard</Text>
                <Text style={styles.heroTitle}>Hi, {firstName}</Text>
                <Text style={styles.specialization} numberOfLines={2}>
                  {mentorProfile?.specialization || 'Add your specialization'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroSubtitle}>
              Manage sessions, track earnings, and keep your availability up to date.
            </Text>

            <View style={styles.heroChipRow}>
              <View style={styles.heroChip}>
                <MaterialIcons name="work-history" size={13} color={TEAL} />
                <Text style={styles.heroChipText}>{(mentorProfile?.experience_years ?? 0) || 0}+ yrs</Text>
              </View>
              <View style={[styles.heroChip, styles.heroChipGold]}>
                <MaterialIcons name="payments" size={13} color={GOLD} />
                <Text style={styles.heroChipText}>
                  {mentorProfile?.price_per_hour ? `₹${mentorProfile.price_per_hour}/hr` : 'Rate not set'}
                </Text>
              </View>
            </View>
          </View>

          {!isComplete ? (
            <TouchableOpacity
              style={styles.completionCard}
              onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
              activeOpacity={0.85}
            >
              <View style={styles.completionHeader}>
                <View style={styles.completionTitleRow}>
                  <MaterialIcons name="bolt" size={18} color={GOLD} />
                  <Text style={styles.completionTitle}>Complete your profile</Text>
                </View>
                <Text style={[styles.completionPct, completionPct >= 80 && { color: C.accent.success }]}>
                  {completionPct}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={
                    completionPct >= 80
                      ? B.successGradient
                      : [GOLD, PURPLE_LINK]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${completionPct}%` }]}
                />
              </View>
              <View style={styles.missingRow}>
                {missing.slice(0, 3).map(f => (
                  <View key={f.key} style={styles.missingChip}>
                    <MaterialIcons name="add-circle-outline" size={12} color={GOLD} />
                    <Text style={styles.missingLabel}>{f.label}</Text>
                  </View>
                ))}
                {missing.length > 3 ? (
                  <View style={styles.missingChip}>
                    <Text style={styles.missingLabel}>+{missing.length - 3} more</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.completionCta}>Tap to complete →</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completionDone}>
              <MaterialIcons name="verified" size={16} color={C.accent.success} />
              <Text style={styles.completionDoneTxt}>Profile complete — you're discoverable!</Text>
            </View>
          )}

          <View style={styles.statsBar}>
            <StatSegment
              icon="payments"
              iconColor={TEAL}
              value={formatCurrency(totalEarnings)}
              label="Earned"
            />
            <View style={styles.statDivider} />
            <StatSegment
              icon="event"
              iconColor={PURPLE_LINK}
              value={String(totalSessions)}
              label="Sessions"
            />
            <View style={styles.statDivider} />
            <StatSegment
              icon="groups"
              iconColor="#e879f9"
              value={String(subscriberCount)}
              label="Subs"
            />
            <View style={styles.statDivider} />
            <StatSegment
              icon="star"
              iconColor={GOLD}
              value={ratingDisplay}
              label="Rating"
            />
          </View>
        </>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12,12,40,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: T.spacing.md,
    alignSelf: 'flex-start',
  },
  hero: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    ...Platform.select({ ios: T.shadows.medium, android: { elevation: 6 } }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  heroIconRing: {},
  heroIconRingGrad: {
    padding: 2,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary.void,
  },
  avatarPh: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: S.accentViolet,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: PURPLE_LINK,
  },
  heroBody: { flex: 1, minWidth: 0 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: S.accentTeal,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.25)',
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    color: TEAL,
    fontWeight: '700',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE_LINK,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.4,
  },
  specialization: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 18,
  },
  heroSubtitle: {
    fontSize: 13,
    color: C.text.secondary,
    lineHeight: 20,
    marginBottom: T.spacing.sm,
  },
  heroChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.xs,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: T.spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroChipGold: {
    backgroundColor: S.accentGold,
    borderColor: 'rgba(240,216,117,0.25)',
  },
  heroChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.text.primary,
  },
  completionCard: {
    backgroundColor: S.accentGold,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.25)',
    padding: T.spacing.md,
    marginBottom: T.spacing.md,
    gap: T.spacing.sm,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.xs,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text.primary,
  },
  completionPct: {
    fontSize: 18,
    fontWeight: '800',
    color: GOLD,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 6,
  },
  missingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.xs,
  },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.2)',
  },
  missingLabel: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '600',
  },
  completionCta: {
    fontSize: 12,
    color: C.text.muted,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  completionDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    backgroundColor: S.accentSuccess,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: B.successBorder,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    marginBottom: T.spacing.md,
  },
  completionDoneTxt: {
    fontSize: 13,
    color: C.accent.success,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
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
    letterSpacing: -0.4,
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginVertical: 6,
    alignSelf: 'stretch',
  },
});
