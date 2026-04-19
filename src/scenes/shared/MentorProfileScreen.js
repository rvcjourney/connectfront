import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import Button from '../../components/Button';
import { StarRating } from '../../components/StarRating';
import { mentorApi } from '../../api/mentorApi';
import { reviewsApi } from '../../api/reviewsApi';
import { formatPrice } from '../../utils/formatCurrency';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const C = T.colors;
const TB = C.tabBar;

function StatPill({ icon, label, value, accent }) {
  return (
    <View style={styles.statPill}>
      <LinearGradient
        colors={['rgba(167, 139, 250, 0.18)', 'rgba(94, 234, 212, 0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statPillInner}
      >
        <View style={[styles.statIconWrap, { borderColor: accent + '55' }]}>
          <MaterialIcons name={icon} size={20} color={accent} />
        </View>
        <Text style={styles.statPillValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.statPillLabel} numberOfLines={2}>
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}

export default function MentorProfileScreen({ navigation, route }) {
  const { mentorId } = route.params;
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadMentorProfile();
  }, [mentorId]);

  const loadMentorProfile = async () => {
    try {
      setLoading(true);
      const [data, reviewData] = await Promise.all([
        mentorApi.getMentorWithProfile(mentorId),
        reviewsApi.getReviewsForMentor(mentorId),
      ]);
      setMentor(data);
      setReviews(reviewData);
    } catch {
      setMentor(null);
      Toast.show('Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Loading profile…" />;
  }

  if (!mentor) {
    return (
      <SafeScreen scrollable={false} padding={T.spacing.lg} hasBottomTabs={false}>
        <View style={styles.errorWrap}>
          <LinearGradient
            colors={['rgba(248, 113, 113, 0.15)', 'rgba(6, 6, 31, 0.9)']}
            style={styles.errorIconRing}
          >
            <MaterialIcons name="person-off" size={40} color={C.accent.error} />
          </LinearGradient>
          <Text style={styles.errorTitle}>Mentor not found</Text>
          <Text style={styles.errorSub}>This profile may be unavailable. Try going back and opening it again.</Text>
          <Button text="Go back" onPress={() => navigation.goBack()} style={styles.errorBtn} />
        </View>
      </SafeScreen>
    );
  }

  const avatarUrl = mentor.profiles?.avatar_url;
  const name = mentor.profiles?.name || 'Unknown';
  const specialization = mentor.specialization || 'Not specified';
  const bio = mentor.bio || 'No bio provided yet.';
  const experienceYears = mentor.experience_years ?? 0;
  const pricePerHour = mentor.price_per_hour ?? 0;
  const rating = mentor.rating ?? 0;
  const totalSessions = mentor.total_sessions ?? 0;

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false}>
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + T.spacing.sm }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backHit}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close profile"
          >
            <MaterialIcons name="arrow-back" size={24} color={C.text.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Mentor Profile</Text>
          <View style={styles.topBarRightBadge}>
            <MaterialIcons name="verified" size={14} color={C.accent.secondary} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.22)', 'rgba(6, 6, 31, 0.95)', 'transparent']}
            locations={[0, 0.55, 1]}
            style={styles.heroWash}
            pointerEvents="none"
          />

          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.14)', 'rgba(94, 234, 212, 0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCardGlow}
              pointerEvents="none"
            />
            <View style={styles.hero}>
              <View style={styles.avatarRing}>
                <LinearGradient
                  colors={TB.topNavIconRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarRingGrad}
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <MaterialIcons name="person" size={52} color={C.accent.primary} />
                    </View>
                  )}
                </LinearGradient>
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.profileEyebrow}>Mentor profile</Text>
                <Text style={styles.name}>{name}</Text>

                <View style={styles.specialtyChip}>
                  <MaterialIcons name="school" size={16} color={C.accent.primary} />
                  <Text style={styles.specialtyText} numberOfLines={2}>
                    {specialization}
                  </Text>
                </View>

                <View style={styles.ratingRow}>
                  <StarRating rating={rating} size={17} />
                  <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
                  <Text style={styles.ratingMeta}>Learner rating</Text>
                </View>

                <View style={styles.heroMetaRow}>
                  <View style={styles.heroMetaChip}>
                    <MaterialIcons name="event-available" size={14} color={C.text.muted} />
                    <Text style={styles.sessionsHint}>{totalSessions} sessions</Text>
                  </View>
                  <View style={styles.heroMetaChip}>
                    <MaterialIcons name="payments" size={14} color={C.text.muted} />
                    <Text style={styles.sessionsHint}>{formatPrice(pricePerHour)}/hr</Text>
                  </View>
                  <View style={styles.heroMetaChip}>
                    <MaterialIcons name="workspace-premium" size={14} color={C.text.muted} />
                    <Text style={styles.sessionsHint}>
                      {experienceYears > 0 ? `${experienceYears}+ yrs` : 'New mentor'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionEyebrow}>Overview</Text>
          <View style={styles.statsRow}>
            <StatPill
              icon="history-edu"
              label="Experience"
              value={`${experienceYears} yr${experienceYears === 1 ? '' : 's'}`}
              accent={C.accent.secondary}
            />
            <StatPill
              icon="payments"
              label="Rate / hr"
              value={formatPrice(pricePerHour)}
              accent={C.accent.primary}
            />
            <StatPill
              icon="groups"
              label="Sessions"
              value={`${totalSessions}`}
              accent={C.accent.success}
            />
          </View>

          <Text style={styles.sectionEyebrow}>About Mentor</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <LinearGradient
                colors={['rgba(94, 234, 212, 0.2)', 'rgba(167, 139, 250, 0.12)']}
                style={styles.aboutIconBadge}
              >
                <MaterialIcons name="format-quote" size={20} color={C.accent.secondary} />
              </LinearGradient>
              <Text style={styles.aboutTitle}>About</Text>
            </View>
            <View style={styles.aboutAccent} />
            <Text style={styles.aboutBody}>{bio}</Text>
          </View>

          {/* Reviews */}
          <Text style={styles.sectionEyebrow}>Reviews ({reviews.length})</Text>
          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.slice(0, 5).map(r => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      {r.profiles?.avatar_url ? (
                        <Image source={{ uri: r.profiles.avatar_url }} style={styles.reviewAvatarImg} />
                      ) : (
                        <MaterialIcons name="person" size={18} color={C.accent.secondary} />
                      )}
                    </View>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewerName}>{r.profiles?.name || 'Learner'}</Text>
                      <StarRating rating={r.rating} size={13} />
                    </View>
                  </View>
                  {r.comment ? (
                    <Text style={styles.reviewComment}>{r.comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noReviews}>
              <MaterialIcons name="rate-review" size={28} color={C.text.muted} />
              <Text style={styles.noReviewsTxt}>No reviews yet</Text>
            </View>
          )}

          <View style={{ height: T.spacing.xxxl }} />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, T.spacing.md),
            },
          ]}
        >
          <LinearGradient
            colors={TB.flatBarEdge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.footerEdge}
          />
          <LinearGradient
            colors={['rgba(6, 6, 31, 0.97)', 'rgba(12, 12, 40, 0.99)']}
            style={styles.footerInner}
          >
            <Text style={styles.footerHint}>
              Choose a date and time in the next step.
            </Text>
            <Button
              text="Book a session"
              onPress={() =>
                navigation.navigate(SCREEN_NAMES.Booking, {
                  mentorId,
                  mentorName: name,
                })
              }
              style={styles.bookButton}
            />
          </LinearGradient>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.md,
    paddingBottom: T.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border.light,
    backgroundColor: 'rgba(6, 6, 31, 0.72)',
  },
  backHit: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    ...T.typography.bodyMd,
    color: C.text.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topBarRightBadge: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: T.spacing.lg,
  },
  heroWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 320,
  },
  profileCard: {
    marginHorizontal: T.spacing.lg,
    marginTop: T.spacing.md,
    marginBottom: T.spacing.lg,
    borderRadius: T.borderRadius.xl,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.card,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: C.accent.secondary,
    ...Platform.select({
      ios: T.shadows.medium,
      android: { elevation: 4 },
    }),
  },
  profileCardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  hero: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: T.spacing.md,
    padding: T.spacing.lg,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 68,
  },
  avatarRingGrad: {
    padding: 3,
    borderRadius: 65,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: C.primary.dark,
  },
  heroInfo: {
    width: '100%',
    alignItems: 'center',
  },
  profileEyebrow: {
    ...T.typography.labelSm,
    color: C.accent.secondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border.light,
  },
  name: {
    ...T.typography.headingMd,
    fontSize: 24,
    color: C.text.primary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: T.spacing.xs,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    alignSelf: 'center',
    maxWidth: '92%',
    paddingVertical: T.spacing.sm,
    paddingHorizontal: T.spacing.md,
    borderRadius: T.borderRadius.md,
    backgroundColor: C.component.input,
    borderWidth: 1,
    borderColor: C.border.light,
    marginBottom: T.spacing.sm,
  },
  specialtyText: {
    ...T.typography.bodySm,
    color: C.accent.primary,
    fontWeight: '700',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
    gap: T.spacing.sm,
  },
  ratingNum: {
    ...T.typography.labelLg,
    color: C.text.primary,
    fontWeight: '800',
  },
  ratingMeta: {
    ...T.typography.bodySm,
    color: C.text.muted,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: T.borderRadius.md,
    paddingVertical: 7,
    paddingHorizontal: T.spacing.sm,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  sessionsHint: {
    ...T.typography.bodySm,
    color: C.text.muted,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: T.spacing.lg,
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    ...T.typography.labelSm,
    color: C.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
  },
  statPill: {
    flex: 1,
    minWidth: 0,
    borderRadius: T.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border.light,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 3 },
    }),
  },
  statPillInner: {
    padding: T.spacing.md,
    alignItems: 'center',
    minHeight: 112,
    justifyContent: 'center',
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 0, 20, 0.35)',
    borderWidth: 1,
    marginBottom: T.spacing.sm,
  },
  statPillValue: {
    ...T.typography.labelLg,
    color: C.text.primary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  statPillLabel: {
    ...T.typography.labelSm,
    color: C.text.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  aboutCard: {
    marginHorizontal: T.spacing.lg,
    backgroundColor: C.component.card,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.border.light,
    padding: T.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: C.accent.primary,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 2 },
    }),
    marginBottom: T.spacing.sm,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    marginBottom: T.spacing.md,
  },
  aboutIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border.light,
  },
  aboutTitle: {
    ...T.typography.headingSm,
    fontSize: 18,
    color: C.text.primary,
    fontWeight: '800',
  },
  aboutAccent: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.accent.secondary,
    opacity: 0.85,
    marginBottom: T.spacing.md,
  },
  aboutBody: {
    ...T.typography.bodyMd,
    color: C.text.secondary,
    lineHeight: 24,
  },
  reviewsList: { gap: T.spacing.sm, marginBottom: T.spacing.lg },
  reviewCard: {
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.md,
    gap: T.spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.sm },
  reviewAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(94,234,212,0.1)',
    borderWidth: 1, borderColor: 'rgba(94,234,212,0.2)',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  reviewAvatarImg: { width: 34, height: 34, borderRadius: 17 },
  reviewMeta: { gap: 2 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: C.text.primary },
  reviewComment: { fontSize: 13, color: C.text.secondary, lineHeight: 20 },
  noReviews: {
    alignItems: 'center', paddingVertical: T.spacing.xl, gap: T.spacing.sm,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.md,
    borderWidth: 1, borderColor: T.colors.border.light,
    marginBottom: T.spacing.lg,
  },
  noReviewsTxt: { fontSize: 13, color: C.text.muted },
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border.light,
    backgroundColor: 'rgba(6, 6, 31, 0.94)',
  },
  footerEdge: {
    height: 2,
    opacity: 0.45,
  },
  footerInner: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
  },
  footerHint: {
    ...T.typography.bodySm,
    color: C.text.muted,
    textAlign: 'center',
    marginBottom: T.spacing.sm,
  },
  bookButton: {
    marginBottom: 0,
    borderRadius: T.borderRadius.md,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: T.spacing.xl,
  },
  errorIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  errorTitle: {
    ...T.typography.headingSm,
    color: C.text.primary,
    marginBottom: T.spacing.sm,
    textAlign: 'center',
  },
  errorSub: {
    ...T.typography.bodySm,
    color: C.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: T.spacing.xl,
  },
  errorBtn: {
    minWidth: 200,
  },
});
