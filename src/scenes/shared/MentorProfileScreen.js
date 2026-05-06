import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import RazorpayCheckout from 'react-native-razorpay';
import Video from 'react-native-video';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import Button from '../../components/Button';
import { StarRating } from '../../components/StarRating';
import { mentorApi } from '../../api/mentorApi';
import { reviewsApi } from '../../api/reviewsApi';
import { videoApi } from '../../api/videoApi';
import { paymentApi } from '../../api/paymentApi';
import { formatPrice } from '../../utils/formatCurrency';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { useAuth } from '../../hooks/useAuth';

const T = UNIFIED_THEME;
const C = T.colors;
const TB = C.tabBar;
const FREE_LIMIT = 2; // first N videos are always free regardless of is_free flag

// ─── Video Player Modal ───────────────────────────────────────────────────────
function VideoPlayerModal({ video, onClose }) {
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState(false);

  if (!video) return null;

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <View style={vStyles.container}>
        <Video
          source={{ uri: video.video_url }}
          style={vStyles.video}
          resizeMode="contain"
          paused={paused}
          onLoadStart={() => { setBuffering(true); setError(false); }}
          onLoad={() => setBuffering(false)}
          onError={() => { setBuffering(false); setError(true); }}
          repeat={false}
        />
        {buffering && !error && (
          <ActivityIndicator style={vStyles.loader} size="large" color={C.accent.secondary} />
        )}
        {error && (
          <View style={vStyles.errorBox}>
            <MaterialIcons name="error-outline" size={40} color={C.accent.error} />
            <Text style={vStyles.errorText}>Could not play video</Text>
          </View>
        )}
        <View style={vStyles.topBar}>
          <TouchableOpacity onPress={onClose} style={vStyles.closeBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={vStyles.titleText} numberOfLines={1}>{video.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <TouchableOpacity style={vStyles.playArea} onPress={() => setPaused(p => !p)} activeOpacity={1}>
          {paused && (
            <View style={vStyles.playBtn}>
              <MaterialIcons name="play-arrow" size={52} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const vStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loader: { position: 'absolute', alignSelf: 'center' },
  errorBox: { alignItems: 'center', gap: 8 },
  errorText: { color: C.accent.error, fontSize: 14 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 16, paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  closeBtn: { padding: 8, width: 40 },
  titleText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  playArea: { position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});

// ─── Single Video Tile ────────────────────────────────────────────────────────
function VideoTile({ video, index, isUnlocked, onPlay, onLockPress }) {
  const isFree = video.is_free || index < FREE_LIMIT;
  const canPlay = isFree || isUnlocked;

  return (
    <TouchableOpacity
      style={vTile.card}
      activeOpacity={0.85}
      onPress={() => canPlay ? onPlay(video) : onLockPress()}
    >
      <LinearGradient
        colors={canPlay
          ? ['rgba(94,234,212,0.18)', 'rgba(124,58,237,0.22)']
          : ['rgba(30,20,60,0.9)', 'rgba(10,6,30,0.95)']}
        style={vTile.thumb}
      >
        {canPlay ? (
          <MaterialIcons name="play-circle-filled" size={38} color="rgba(255,255,255,0.8)" />
        ) : (
          <MaterialIcons name="lock" size={30} color="rgba(255,255,255,0.35)" />
        )}
        {isFree && (
          <View style={vTile.freeBadge}>
            <Text style={vTile.freeBadgeText}>FREE</Text>
          </View>
        )}
      </LinearGradient>
      <View style={vTile.info}>
        <Text style={vTile.title} numberOfLines={2}>{video.title}</Text>
        {!canPlay && <MaterialIcons name="lock" size={12} color={C.text.muted} style={{ marginTop: 2 }} />}
      </View>
    </TouchableOpacity>
  );
}

const vTile = StyleSheet.create({
  card: { width: 130, marginRight: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  thumb: { width: 130, height: 110, alignItems: 'center', justifyContent: 'center' },
  freeBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: C.accent.success, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  freeBadgeText: { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  info: { padding: 8 },
  title: { color: C.text.secondary, fontSize: 11, fontWeight: '600', lineHeight: 15 },
});

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
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(299);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadMentorProfile();
  }, [mentorId]);

  const loadMentorProfile = async () => {
    try {
      setLoading(true);
      const [data, reviewData, vids, price, unlocked] = await Promise.all([
        mentorApi.getMentorWithProfile(mentorId),
        reviewsApi.getReviewsForMentor(mentorId),
        videoApi.getMentorVideos(mentorId),
        videoApi.getUnlockPrice(mentorId),
        user ? videoApi.checkUnlocked({ learnerId: user.id, mentorId }) : Promise.resolve(false),
      ]);
      setMentor(data);
      setReviews(reviewData);
      setVideos(vids);
      setUnlockPrice(price);
      setIsUnlocked(unlocked);
    } catch {
      setMentor(null);
      Toast.show('Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!user) { Toast.show('Please log in to unlock'); return; }
    setUnlocking(true);
    try {
      const order = await paymentApi.createOrder({
        mentorId,
        learnerId: user.id,
        slotId: null,
        amountPaise: unlockPrice * 100,
        mentorAmountPaise: Math.round(unlockPrice * 80),
        platformFeePaise: Math.round(unlockPrice * 20),
      });

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Connect',
        description: 'Unlock mentor video library',
        order_id: order.orderId,
        prefill: { email: user.email || '' },
        theme: { color: '#5eead4' },
      };

      const paymentData = await RazorpayCheckout.open(options);
      await videoApi.recordUnlock({ learnerId: user.id, mentorId, amountPaid: unlockPrice });
      setIsUnlocked(true);
      Toast.show('Subscribed! Watch all videos this month.', Toast.SHORT);
    } catch (e) {
      if (e?.code !== 'PAYMENT_CANCELLED') {
        Toast.show(e?.message || 'Payment failed', Toast.LONG);
      }
    } finally {
      setUnlocking(false);
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

          {/* ── Videos Section ── */}
          {videos.length > 0 && (
            <>
              <View style={styles.videoSectionHeader}>
                <Text style={styles.sectionEyebrow}>Videos ({videos.length})</Text>
                {!isUnlocked && videos.some((v, i) => !v.is_free && i >= FREE_LIMIT) && (
                  <View style={styles.lockBadge}>
                    <MaterialIcons name="lock" size={11} color={C.accent.primary} />
                    <Text style={styles.lockBadgeText}>Some locked</Text>
                  </View>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.videoRow}
              >
                {videos.map((v, i) => (
                  <VideoTile
                    key={v.id}
                    video={v}
                    index={i}
                    isUnlocked={isUnlocked}
                    onPlay={setPlayingVideo}
                    onLockPress={() => {}}
                  />
                ))}
              </ScrollView>

              {/* Unlock paywall */}
              {!isUnlocked && videos.some((v, i) => !v.is_free && i >= FREE_LIMIT) && (
                <TouchableOpacity
                  style={[styles.unlockBtn, unlocking && { opacity: 0.6 }]}
                  onPress={handleUnlock}
                  disabled={unlocking}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['rgba(240,216,117,0.18)', 'rgba(94,234,212,0.12)']}
                    style={styles.unlockBtnInner}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {unlocking ? (
                      <ActivityIndicator color={C.accent.primary} size="small" />
                    ) : (
                      <>
                        <MaterialIcons name="lock-open" size={18} color={C.accent.primary} />
                        <Text style={styles.unlockBtnText}>
                          Subscribe to videos · ₹{unlockPrice}/mo
                        </Text>
                        <MaterialIcons name="chevron-right" size={18} color={C.accent.primary} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {isUnlocked && (
                <View style={styles.unlockedBadge}>
                  <MaterialIcons name="check-circle" size={14} color={C.accent.success} />
                  <Text style={styles.unlockedText}>Subscribed — watch all videos this month</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: T.spacing.xxxl }} />
        </ScrollView>

        <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />

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

  // Videos section
  videoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.sm,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(240,216,117,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.2)',
  },
  lockBadgeText: { color: C.accent.primary, fontSize: 10, fontWeight: '700' },
  videoRow: {
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.sm,
  },
  unlockBtn: {
    marginHorizontal: T.spacing.lg,
    marginTop: 8,
    marginBottom: T.spacing.md,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.25)',
  },
  unlockBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unlockBtnText: {
    color: C.accent.primary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: T.spacing.lg,
    marginBottom: T.spacing.md,
  },
  unlockedText: { color: C.accent.success, fontSize: 12, fontWeight: '600' },
});
