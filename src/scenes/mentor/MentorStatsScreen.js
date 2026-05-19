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
const TB = T.colors.tabBar;

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
  return <Animated.View style={[{ backgroundColor: T.colors.border.default, borderRadius: T.borderRadius.sm }, style, { opacity }]} />;
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
    { key: 'photo',          label: 'Profile photo',       done: Boolean(profile?.avatar_url) },
    { key: 'name',           label: 'Full name',            done: Boolean(profile?.name?.trim()) },
    { key: 'specialization', label: 'Specialization',       done: Boolean(mentorProfile?.specialization?.trim()) },
    { key: 'bio',            label: 'Bio',                  done: Boolean(mentorProfile?.bio?.trim()) },
    { key: 'price',          label: 'Session rate',         done: Boolean(mentorProfile?.price_per_hour > 0) },
    { key: 'experience',     label: 'Years of experience',  done: Boolean(mentorProfile?.experience_years > 0) },
  ];
  const completedCount = PROFILE_FIELDS.filter(f => f.done).length;
  const completionPct  = Math.round((completedCount / PROFILE_FIELDS.length) * 100);
  const isComplete     = completionPct === 100;
  const missing        = PROFILE_FIELDS.filter(f => !f.done);
  const firstName      = profile?.name?.split(/\s+/)[0] || 'there';
  const ratingDisplay  = typeof rating === 'number' ? rating.toFixed(1) : String(rating);

  return (
    <SafeScreen
      scrollable
      padding={T.spacing.lg}
      includeTopInset={false}
      hasBottomTabs={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.colors.accent.secondary} />
      }
    >
      {/* Back button */}
      <TouchableOpacity style={[styles.backBtn, { marginTop: insets.top }]} onPress={onClose ?? (() => navigation.goBack())} activeOpacity={0.8}>
        <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
      </TouchableOpacity>

      {loading && !refreshing ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          <SkeletonBone style={{ height: 200, borderRadius: T.borderRadius.lg }} />
          <SkeletonBone style={{ height: 72 }} />
          <SkeletonBone style={{ height: 120 }} />
        </View>
      ) : (
        <View style={styles.hero}>
          <LinearGradient
            colors={TB.flatBarEdge}
            locations={[0, 0.4, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroTopBeam}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(94,234,212,0.12)', 'rgba(167,139,250,0.12)', 'rgba(2,0,20,0.65)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Avatar */}
          <View style={styles.heroAvatarSmall}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url, cache: 'reload' }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.avatarPh]}>
                <Text style={styles.avatarLetter}>{profile?.name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
          </View>

          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <MaterialIcons name="school" size={16} color={T.colors.accent.secondary} />
              <Text style={styles.heroBadgeText}>Mentor</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Hi, {firstName}</Text>
          <Text style={styles.specialization} numberOfLines={2}>
            {mentorProfile?.specialization || 'Add your specialization'}
          </Text>
          <Text style={styles.heroSubtitle}>
            Manage sessions, track earnings, and keep your availability up to date.
          </Text>

          {/* Experience */}
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaChip}>
              <MaterialIcons name="work-history" size={14} color={T.colors.accent.secondary} />
              <Text style={styles.heroMetaText}>{(mentorProfile?.experience_years ?? 0) || 0}+ yrs experience</Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.heroPricingRow}>
            <View style={[styles.heroMetaChip, styles.heroPricingChip]}>
              <MaterialIcons name="payments" size={14} color={T.colors.accent.success} />
              <Text style={styles.heroMetaText}>
                Session: {mentorProfile?.price_per_hour ? `₹${mentorProfile.price_per_hour}/hr` : 'Not set'}
              </Text>
            </View>
            <View style={[styles.heroMetaChip, styles.heroPricingChip]}>
              <MaterialIcons name="star" size={14} color={T.colors.accent.warning} />
              <Text style={styles.heroMetaText}>
                Subscribe: {mentorProfile?.unlock_price ? `₹${mentorProfile.unlock_price}/mo` : 'Not set'}
              </Text>
            </View>
          </View>

          {/* Profile completion */}
          {!isComplete ? (
            <TouchableOpacity
              style={styles.completionCard}
              onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
              activeOpacity={0.85}
            >
              <View style={styles.completionHeader}>
                <View style={styles.completionTitleRow}>
                  <MaterialIcons name="bolt" size={18} color={T.colors.accent.warning} />
                  <Text style={styles.completionTitle}>Complete your profile</Text>
                </View>
                <Text style={[styles.completionPct, completionPct >= 80 && { color: T.colors.accent.success }]}>
                  {completionPct}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={completionPct >= 80
                    ? [T.colors.accent.success, T.colors.accent.secondary]
                    : [T.colors.accent.warning, T.colors.accent.primary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${completionPct}%` }]}
                />
              </View>
              <View style={styles.missingRow}>
                {missing.slice(0, 3).map(f => (
                  <View key={f.key} style={styles.missingChip}>
                    <MaterialIcons name="add-circle-outline" size={12} color={T.colors.accent.warning} />
                    <Text style={styles.missingLabel}>{f.label}</Text>
                  </View>
                ))}
                {missing.length > 3 && (
                  <View style={styles.missingChip}>
                    <Text style={styles.missingLabel}>+{missing.length - 3} more</Text>
                  </View>
                )}
              </View>
              <View style={styles.completionFooter}>
                <Text style={styles.completionCta}>Tap to complete →</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.completionDone}>
              <MaterialIcons name="verified" size={16} color={T.colors.accent.success} />
              <Text style={styles.completionDoneTxt}>Profile complete — you're discoverable!</Text>
            </View>
          )}

          {/* Stats snapshot */}
          <View style={styles.heroSnapshot}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Earned</Text>
              <Text style={styles.snapshotValue} numberOfLines={1}>{formatCurrency(totalEarnings)}</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Sessions</Text>
              <Text style={styles.snapshotValue}>{totalSessions}</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Subscribers</Text>
              <View style={styles.snapshotRatingRow}>
                <MaterialIcons name="groups" size={15} color={T.colors.accent.primary} />
                <Text style={styles.snapshotValue}>{subscriberCount}</Text>
              </View>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Rating</Text>
              <View style={styles.snapshotRatingRow}>
                <MaterialIcons name="star" size={15} color={T.colors.accent.warning} />
                <Text style={styles.snapshotValue}>{ratingDisplay}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: T.colors.component.input,
    borderWidth: 1, borderColor: T.colors.border.light,
    marginBottom: T.spacing.md,
  },
  hero: {
    borderRadius: T.borderRadius.lg,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.xl,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
    ...Platform.select({ ios: T.shadows?.small, android: { elevation: 4 } }),
  },
  heroTopBeam: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 2, opacity: 0.9, zIndex: 1,
  },
  heroAvatarSmall: {
    position: 'absolute', top: T.spacing.lg, right: T.spacing.lg,
    width: 78, height: 78, borderRadius: T.borderRadius.md, overflow: 'hidden',
    borderWidth: 2, borderColor: T.colors.border.default,
    backgroundColor: T.colors.primary.dark, zIndex: 2,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: T.spacing.sm, zIndex: 1 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: T.spacing.sm + 2, paddingVertical: 5,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1, borderColor: T.colors.border.light,
  },
  heroBadgeText: { ...T.typography.labelSm, color: T.colors.text.secondary, fontWeight: '700' },
  heroTitle: { ...T.typography.headingMd, color: T.colors.text.primary, fontWeight: '800', marginBottom: T.spacing.sm, zIndex: 1 },
  heroSubtitle: { ...T.typography.bodyMd, color: T.colors.text.muted, lineHeight: 22, marginBottom: T.spacing.md, zIndex: 1, paddingRight: 76 },
  heroMetaRow: { flexDirection: 'row', gap: T.spacing.sm, marginBottom: T.spacing.sm, zIndex: 1, paddingRight: 76 },
  heroPricingRow: { flexDirection: 'row', gap: T.spacing.sm, marginBottom: T.spacing.md, zIndex: 1 },
  heroPricingChip: { flex: 1, justifyContent: 'center' },
  heroMetaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: T.spacing.sm,
    borderRadius: T.borderRadius.sm, borderWidth: 1,
    borderColor: T.colors.border.light, backgroundColor: T.colors.component.input, flexShrink: 1,
  },
  heroMetaText: { ...T.typography.labelSm, color: T.colors.text.secondary, fontWeight: '700' },
  heroSnapshot: {
    flexDirection: 'row', alignItems: 'stretch',
    borderTopWidth: 1, borderTopColor: T.colors.border.light,
    paddingTop: T.spacing.md, marginTop: T.spacing.md, zIndex: 1,
  },
  snapshotItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  snapshotDivider: { width: StyleSheet.hairlineWidth, backgroundColor: T.colors.border.light, opacity: 0.7, marginVertical: T.spacing.xs },
  snapshotLabel: { ...T.typography.labelSm, color: T.colors.text.muted, marginBottom: 4, textAlign: 'center' },
  snapshotValue: { ...T.typography.labelMd, color: T.colors.text.primary, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  snapshotRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completionCard: {
    backgroundColor: 'rgba(251,191,36,0.07)', borderRadius: T.borderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
    padding: T.spacing.md, marginTop: T.spacing.md, gap: T.spacing.sm,
  },
  completionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.xs },
  completionTitle: { fontSize: 13, fontWeight: '700', color: T.colors.text.primary },
  completionPct: { fontSize: 18, fontWeight: '800', color: T.colors.accent.warning },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, minWidth: 6 },
  missingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing.xs },
  missingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: T.borderRadius.round,
    paddingHorizontal: T.spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)',
  },
  missingLabel: { fontSize: 11, color: T.colors.accent.warning, fontWeight: '600' },
  completionFooter: { alignItems: 'flex-end' },
  completionCta: { fontSize: 12, color: T.colors.text.muted, fontWeight: '600' },
  completionDone: {
    flexDirection: 'row', alignItems: 'center', gap: T.spacing.sm,
    backgroundColor: 'rgba(52,211,153,0.08)', borderRadius: T.borderRadius.md,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
    paddingHorizontal: T.spacing.md, paddingVertical: T.spacing.sm, marginTop: T.spacing.md,
  },
  completionDoneTxt: { fontSize: 13, color: T.colors.accent.success, fontWeight: '600' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPh: { justifyContent: 'center', alignItems: 'center', backgroundColor: T.colors.component.input },
  avatarLetter: { fontSize: 30, fontWeight: '800', color: T.colors.accent.primary },
  specialization: { ...T.typography.bodyMd, color: T.colors.accent.primary, fontWeight: '600', marginBottom: T.spacing.md, lineHeight: 22 },
});
