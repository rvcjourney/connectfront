import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  AppState,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-simple-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UNIFIED_THEME } from '../../unifiedTheme';
import {
  getFloatingTabBarHeight,
  getFloatingTabBarContentInset,
} from '../../components/CosmicBottomTabBar';
import CosmicButton from '../../components/CosmicButton';
import { videoApi } from '../../api/videoApi';
import { homeApi } from '../../api/homeApi';
import { useAuth } from '../../hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;
const PANEL_BG = '#161432';
const SHEET_BG = '#0f0e2a';
const GLASS_BORDER = 'rgba(167,139,250,0.22)';

function SkeletonBone({ style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.38] });
  return <Animated.View style={[sk.bone, style, { opacity }]} />;
}

function VideosSkeleton({ bottomInset }) {
  return (
    <View style={sk.root}>
      <SkeletonBone style={sk.shimmerVideo} />
      <View style={[sk.shimmerDock, { paddingBottom: bottomInset }]}>
        <View style={sk.shimmerPanel}>
          <View style={sk.shimmerMentorRow}>
            <SkeletonBone style={sk.shimmerName} />
            <SkeletonBone style={sk.shimmerBadge} />
          </View>
          <SkeletonBone style={sk.shimmerTitle} />
          <SkeletonBone style={sk.shimmerDesc} />
        </View>
      </View>
    </View>
  );
}

function StatusBadge({ item, isUnlocked, onLockPress }) {
  if (item.is_free) {
    return (
      <View style={s.statusPill}>
        <MaterialIcons name="play-circle-filled" size={11} color={TEAL} />
        <Text style={s.statusFree}>Free</Text>
      </View>
    );
  }
  if (isUnlocked) {
    return (
      <View style={s.statusPill}>
        <MaterialIcons name="verified" size={11} color={C.accent.success} />
        <Text style={s.statusSubscribed}>Subscribed</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity style={[s.statusPill, s.statusPillCta]} onPress={() => onLockPress(item)} activeOpacity={0.85}>
      <MaterialIcons name="lock" size={11} color={GOLD} />
      <Text style={s.statusLocked}>Subscribe</Text>
    </TouchableOpacity>
  );
}

function PauseMentorHeader({ item, onViewProfile, badge }) {
  const name = item.profiles?.name || 'Connectiqo';
  const spec = item.mentor_profiles?.specialization;
  const canPress = !!item.mentor_id && onViewProfile;

  const profileBlock = (
    <>
      <LinearGradient colors={B.premiumGradient} style={s.pauseAvatarRing}>
        <View style={s.pauseAvatarInner}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={s.pauseAvatar} />
          ) : (
            <View style={[s.pauseAvatar, s.pauseAvatarFallback]}>
              <MaterialIcons name="person" size={22} color="#fff" />
            </View>
          )}
        </View>
      </LinearGradient>
      <View style={s.pauseMentorText}>
        <Text style={s.pauseMentorName} numberOfLines={1}>{name}</Text>
        {spec ? (
          <Text style={s.pauseMentorSpec} numberOfLines={1}>{spec}</Text>
        ) : null}
        {canPress ? (
          <View style={s.viewProfileInline}>
            <Text style={s.viewProfileText}>View profile</Text>
            <MaterialIcons name="arrow-forward" size={12} color={TEAL} />
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={s.pauseMentorRow}>
      {canPress ? (
        <TouchableOpacity
          style={s.pauseMentorMain}
          onPress={() => onViewProfile(item.mentor_id)}
          activeOpacity={0.85}
        >
          {profileBlock}
        </TouchableOpacity>
      ) : (
        <View style={s.pauseMentorMain}>{profileBlock}</View>
      )}
      {badge}
    </View>
  );
}

// ─── Unlock bottom sheet ──────────────────────────────────────────────────────
function UnlockSheet({ video, onClose, onUnlocked }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const price = video?.mentor_profiles?.unlock_price || 299;
  const mentorName = video?.profiles?.name || 'this mentor';

  const handleUnlock = async () => {
    if (!user) { Toast.show('Please log in'); return; }
    setLoading(true);
    try {
      const order = await videoApi.createVideoOrder({
        mentorId:  video.mentor_id,
        learnerId: user.id,
      });

      const paymentData = await RazorpayCheckout.open({
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency || 'INR',
        name:        'Connectiqo',
        description: `Subscribe to ${mentorName}'s video library`,
        order_id:    order.orderId,
        prefill:     { email: user.email || '' },
        theme:       { color: '#5eead4' },
      });

      await videoApi.verifyVideoSubscription({
        razorpayOrderId:   order.orderId,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        mentorId:          video.mentor_id,
        learnerId:         user.id,
      });

      onUnlocked(video.mentor_id);
      onClose();
      Toast.show('Subscribed! Watch all videos this month.', Toast.SHORT);
    } catch (e) {
      if (e?.code !== 'PAYMENT_CANCELLED') {
        Toast.show(e?.message || 'Payment failed', Toast.LONG);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!video) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={u.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={u.sheet}>
        <View style={u.handle} />

        <View style={u.mentorRow}>
          <LinearGradient colors={B.premiumGradient} style={u.avatarRing}>
            <View style={u.avatarInner}>
              {video.profiles?.avatar_url ? (
                <Image source={{ uri: video.profiles.avatar_url }} style={u.avatar} />
              ) : (
                <View style={[u.avatar, u.avatarFallback]}>
                  <MaterialIcons name="person" size={20} color={PURPLE_LINK} />
                </View>
              )}
            </View>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={u.mentorName}>{mentorName}</Text>
            <Text style={u.mentorSpec}>{video.mentor_profiles?.specialization || ''}</Text>
          </View>
          <View style={u.pricePill}>
            <Text style={u.priceText}>₹{price}</Text>
          </View>
        </View>

        <View style={u.divider} />

        <Text style={u.title}>Subscribe to video library</Text>
        <Text style={u.sub}>Monthly subscription · Access all of {mentorName}'s videos</Text>

        <View style={u.perks}>
          {['All current videos', 'All future uploads', 'Cancel anytime'].map(p => (
            <View key={p} style={u.perkRow}>
              <MaterialIcons name="check-circle" size={16} color={C.accent.success} />
              <Text style={u.perkText}>{p}</Text>
            </View>
          ))}
        </View>

        <CosmicButton
          label={`Subscribe · ₹${price}/mo`}
          variant="nebula"
          onPress={handleUnlock}
          loading={loading}
          disabled={loading}
          style={u.payBtn}
        />

        <CosmicButton
          label="Maybe later"
          variant="goldOutline"
          size="compact"
          onPress={onClose}
          style={u.cancelBtnWrap}
        />
      </View>
    </Modal>
  );
}

const u = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(3,3,8,0.75)' },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: T.spacing.lg,
    paddingBottom: T.spacing.xxxl,
    borderTopWidth: 1,
    borderColor: GLASS_BORDER,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: T.spacing.lg,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    marginBottom: T.spacing.lg,
  },
  avatarRing: { padding: 2, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  avatarInner: { borderRadius: 24, overflow: 'hidden' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: C.primary.void, alignItems: 'center', justifyContent: 'center' },
  mentorName: { color: C.text.primary, fontSize: 15, fontWeight: '800' },
  mentorSpec: { color: GOLD, fontSize: 12, marginTop: 2, fontWeight: '600' },
  pricePill: { backgroundColor: S.accentTeal, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(94,234,212,0.25)' },
  priceText: { color: TEAL, fontSize: 14, fontWeight: '800' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(167,139,250,0.18)',
    marginBottom: T.spacing.lg,
  },
  title: {
    color: C.text.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: T.spacing.xs,
  },
  sub: {
    color: C.text.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: T.spacing.lg,
  },
  perks: {
    gap: T.spacing.sm,
    marginBottom: T.spacing.xl,
    backgroundColor: PANEL_BG,
    borderRadius: 14,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.sm },
  perkText: { color: C.text.secondary, fontSize: 13 },
  payBtn: { marginBottom: T.spacing.sm, marginVertical: 0 },
  cancelBtnWrap: { marginVertical: 0 },
});

// ─── Single short card (full-screen reel) ─────────────────────────────────────
function ShortCard({
  item,
  isActive,
  height,
  bottomInset,
  isUnlocked,
  expiresAt,
  onLockPress,
  onViewProfile,
  forcePaused,
}) {
  const [paused, setPaused] = useState(false);
  const canPlay = item.is_free || isUnlocked;

  const effectivePaused = !isActive || paused || forcePaused;
  const showPauseDetail = canPlay && isActive && paused;

  useEffect(() => {
    if (!isActive && paused) setPaused(false);
  }, [isActive, paused]);

  return (
    <View style={{ height, width: '100%', backgroundColor: C.primary.void }}>
      {/* Thumbnail background */}
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#0d1b3e', '#0a0f2a', '#000']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Video — plays when active + can play */}
      {isActive && canPlay && item.video_url ? (
        <Video
          source={{ uri: item.video_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          paused={effectivePaused}
          repeat
          controls={false}
          ignoreSilentSwitch="obey"
        />
      ) : null}

      {/* Lock overlay for paid+locked */}
      {!canPlay && (
        <View style={s.lockOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.lockCard}>
            <View style={s.lockIconWrap}>
              <MaterialIcons name="lock" size={26} color="#fff" />
            </View>
            <Text style={s.lockTitle}>Premium content</Text>
            <Text style={s.lockSub}>
              Subscribe to {item.profiles?.name || 'this mentor'}'s library
            </Text>
            <CosmicButton
              label={`Unlock · ₹${item.mentor_profiles?.unlock_price || 299}/mo`}
              variant="nebula"
              size="compact"
              onPress={() => onLockPress(item)}
              style={s.lockBtn}
            />
          </View>
        </View>
      )}

      {/* Tap-to-pause — absolute overlay, does not block FlatList scroll */}
      {canPlay && (
        <TouchableOpacity
          style={s.tapArea}
          onPress={() => setPaused(p => !p)}
          activeOpacity={1}
        />
      )}

      {/* Pause indicator */}
      {canPlay && isActive && paused && (
        <View style={s.pauseIcon} pointerEvents="none">
          <View style={s.pauseBackdrop}>
            <MaterialIcons name="play-arrow" size={44} color="#fff" style={s.pauseArrow} />
          </View>
        </View>
      )}

      {showPauseDetail && (
        <>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.95)']}
            locations={[0.3, 0.55, 0.8, 1]}
            style={[s.bottomGradient, s.bottomGradientExpanded]}
            pointerEvents="none"
          />

          <View style={[s.infoDock, { paddingBottom: bottomInset }]}>
            <View style={s.glassPanel}>
              <PauseMentorHeader
                item={item}
                onViewProfile={onViewProfile}
                badge={(
                  <StatusBadge
                    item={item}
                    isUnlocked={isUnlocked}
                    onLockPress={onLockPress}
                  />
                )}
              />
              <View style={s.panelDivider} />
              <Text style={s.pauseVideoTitle} numberOfLines={2}>{item.title}</Text>
              {item.description ? (
                <Text style={s.pauseVideoDesc}>{item.description}</Text>
              ) : null}
              {expiresAt && isUnlocked && !item.is_free ? (
                <Text style={s.expiryText}>
                  Renews {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              ) : null}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function VideosScreen({ navigation, route }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [containerHeight, setContainerHeight] = useState(0);
  const bottomTabHeight = getFloatingTabBarHeight(insets);
  const metadataBottomInset = getFloatingTabBarContentInset(insets);

  const [videos, setVideos]         = useState([]);
  const [unlocksMap, setUnlocksMap] = useState(new Map());
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lockSheetVideo, setLockSheetVideo] = useState(null);

  const flatListRef = useRef(null);
  const startVideoId    = route?.params?.startVideoId;
  const filterMentorId  = route?.params?.filterMentorId;
  const [screenFocused, setScreenFocused] = useState(true);
  const [appActive, setAppActive] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Scroll to top (latest video) when user taps the tab directly
  useEffect(() => {
    const unsubscribe = navigation?.addListener('tabPress', () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      setActiveIndex(0);
    });
    return unsubscribe;
  }, [navigation]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems[0] != null) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfigCallbackPairs = useRef([{
    viewabilityConfig: { itemVisiblePercentThreshold: 60 },
    onViewableItemsChanged,
  }]);

  useEffect(() => {
    loadFeed(false, user?.id);
  }, [user?.id, filterMentorId]);

  // Scroll to startVideoId when navigated from HomeScreen
  useEffect(() => {
    if (!startVideoId || loading || videos.length === 0) return;
    const idx = videos.findIndex(v => v.id === startVideoId);
    if (idx >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        setActiveIndex(idx);
      }, 150);
    }
    navigation?.setParams({ startVideoId: undefined });
  }, [startVideoId, loading, videos]);

  const loadFeed = async (isRefresh = false, userId = user?.id) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [vids, unlocks, homeResult] = await Promise.all([
        videoApi.getAllPublicVideos({ excludeMentorId: null }),
        userId ? videoApi.getLearnerUnlocks(userId) : Promise.resolve(new Map()),
        homeApi.getVideos().catch(() => ({ sessions: [] })),
      ]);

      // Normalize admin videos to match ShortCard's expected shape
      const adminVids = (homeResult.sessions || []).map(v => ({
        ...v,
        is_free: true,
        mentor_id: null,
        profiles: { name: 'Connectiqo', avatar_url: null },
        mentor_profiles: { unlock_price: 0, specialization: 'Featured' },
      }));

      const allVids = [...adminVids, ...vids];

      setVideos(filterMentorId
        ? [...allVids.filter(v => v.mentor_id === filterMentorId), ...allVids.filter(v => v.mentor_id !== filterMentorId)]
        : allVids);
      setUnlocksMap(unlocks);
    } catch (e) {
      Toast.show('Failed to load videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnlocked = useCallback((mentorId) => {
    setUnlocksMap(prev => {
      const next = new Map(prev);
      next.set(mentorId, { expiresAt: null });
      return next;
    });
  }, []);

  const handleViewProfile = useCallback((mentorId) => {
    navigation?.navigate(SCREEN_NAMES.MentorProfile, { mentorId });
  }, [navigation]);

  const onContainerLayout = useCallback((e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0) setContainerHeight(h);
  }, []);

  return (
    <View style={s.root} onLayout={onContainerLayout}>
      {containerHeight === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : loading ? (
        <VideosSkeleton bottomInset={metadataBottomInset} />
      ) : videos.length === 0 ? (
        <View style={[s.center, { paddingHorizontal: T.spacing.lg, paddingBottom: bottomTabHeight }]}>
          <View style={s.emptyPanel}>
            <View style={s.emptyIconRing}>
              <MaterialIcons name="videocam-off" size={40} color={PURPLE_LINK} />
            </View>
            <Text style={s.emptyTitle}>No videos here</Text>
            <Text style={s.emptySubtitle}>Mentors will post short videos here</Text>
          </View>
        </View>
      ) : (
        <View style={s.reelWrap}>
          <FlatList
            ref={flatListRef}
            style={s.reelList}
            data={videos}
            keyExtractor={v => v.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            removeClippedSubviews
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={1}
            renderItem={({ item, index }) => (
              <ShortCard
                item={item}
                height={containerHeight}
                bottomInset={metadataBottomInset}
                isActive={index === activeIndex}
                isUnlocked={unlocksMap.has(item.mentor_id)}
                expiresAt={unlocksMap.get(item.mentor_id)?.expiresAt}
                onLockPress={setLockSheetVideo}
                onViewProfile={handleViewProfile}
                forcePaused={lockSheetVideo !== null || !screenFocused || !appActive}
              />
            )}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
            getItemLayout={(_, index) => ({
              length: containerHeight,
              offset: containerHeight * index,
              index,
            })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadFeed(true, user?.id)}
                tintColor={TEAL}
              />
            }
          />

        </View>
      )}

      <UnlockSheet
        video={lockSheetVideo}
        onClose={() => setLockSheetVideo(null)}
        onUnlocked={handleUnlocked}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary.void,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.md,
    backgroundColor: C.primary.void,
  },
  emptyPanel: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.lg,
  },
  emptyTitle: {
    color: C.text.primary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: T.spacing.sm,
  },
  emptySubtitle: {
    color: C.text.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  reelWrap: {
    flex: 1,
  },
  reelList: {
    flex: 1,
  },
  // ── Short card internals ──────────────────────────────────────────────────
  tapArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
    paddingHorizontal: T.spacing.xl,
  },
  lockCard: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    backgroundColor: 'rgba(15,14,42,0.92)',
    borderRadius: 20,
    padding: T.spacing.xl,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.spacing.md,
  },
  lockTitle: {
    color: C.text.primary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: T.spacing.xs,
  },
  lockSub: {
    color: C.text.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: T.spacing.lg,
  },
  lockBtn: {
    width: '100%',
    marginVertical: 0,
  },

  pauseIcon: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  pauseBackdrop: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseArrow: {
    marginLeft: 4,
  },

  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    zIndex: 2,
  },
  bottomGradientExpanded: {
    height: '58%',
  },

  pauseMentorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  pauseMentorMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    minWidth: 0,
  },
  pauseAvatarRing: {
    padding: 2,
    borderRadius: 24,
  },
  pauseAvatarInner: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  pauseAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pauseAvatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseMentorText: {
    flex: 1,
    minWidth: 0,
  },
  pauseMentorName: {
    color: C.text.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  pauseMentorSpec: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  viewProfileInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  viewProfileText: {
    color: TEAL,
    fontSize: 11,
    fontWeight: '700',
  },
  panelDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: T.spacing.sm,
  },
  pauseVideoTitle: {
    color: C.text.primary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: T.spacing.xs,
    letterSpacing: -0.15,
  },
  pauseVideoDesc: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 19,
  },

  infoDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingHorizontal: T.spacing.md,
  },
  glassPanel: {
    backgroundColor: 'rgba(10,8,28,0.88)',
    borderRadius: 16,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statusPillCta: {
    borderColor: 'rgba(240,216,117,0.35)',
    backgroundColor: 'rgba(240,216,117,0.1)',
  },
  statusFree: {
    color: TEAL,
    fontSize: 10,
    fontWeight: '800',
  },
  statusSubscribed: {
    color: C.accent.success,
    fontSize: 10,
    fontWeight: '800',
  },
  statusLocked: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
  },
  expiryText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: T.spacing.xs,
  },
});

const sk = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary.void,
  },
  bone: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
  },
  shimmerVideo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  shimmerDock: {
    position: 'absolute',
    left: T.spacing.md,
    right: T.spacing.md,
    bottom: 0,
  },
  shimmerPanel: {
    borderRadius: 16,
    padding: T.spacing.md,
    gap: T.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  shimmerMentorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shimmerName: {
    width: 100,
    height: 12,
    borderRadius: 6,
  },
  shimmerBadge: {
    width: 64,
    height: 20,
    borderRadius: 10,
  },
  shimmerTitle: {
    width: '75%',
    height: 16,
    borderRadius: 8,
  },
  shimmerDesc: {
    width: '55%',
    height: 12,
    borderRadius: 6,
  },
});
