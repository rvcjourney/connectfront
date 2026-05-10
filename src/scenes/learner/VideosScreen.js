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
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-simple-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { videoApi } from '../../api/videoApi';
import { useAuth } from '../../hooks/useAuth';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const C = T.colors;

const FILTERS = [
  { key: 'all',        label: 'All',        icon: 'apps' },
  { key: 'free',       label: 'Free',       icon: 'play-circle-filled' },
  { key: 'locked',     label: 'Locked',     icon: 'lock' },
  { key: 'subscribed', label: 'Subscribed', icon: 'check-circle' },
];

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
          {video.profiles?.avatar_url ? (
            <Image source={{ uri: video.profiles.avatar_url }} style={u.avatar} />
          ) : (
            <View style={[u.avatar, u.avatarFallback]}>
              <MaterialIcons name="person" size={22} color={C.accent.primary} />
            </View>
          )}
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

        <TouchableOpacity
          style={[u.payBtn, loading && { opacity: 0.6 }]}
          onPress={handleUnlock}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.accent.secondary, C.accent.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={u.payBtnInner}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={u.payBtnText}>Subscribe · ₹{price}/mo</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={u.cancelBtn}>
          <Text style={u.cancelText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const u = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: '#0f0e2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  mentorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  mentorName: { color: C.text.primary, fontSize: 15, fontWeight: '700' },
  mentorSpec: { color: C.text.muted, fontSize: 12, marginTop: 2 },
  pricePill: { backgroundColor: 'rgba(94,234,212,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(94,234,212,0.25)' },
  priceText: { color: C.accent.secondary, fontSize: 14, fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 },
  title: { color: C.text.primary, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sub: { color: C.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  perks: { gap: 10, marginBottom: 24 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { color: C.text.secondary, fontSize: 13 },
  payBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  payBtnInner: { paddingVertical: 15, alignItems: 'center' },
  payBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: C.text.muted, fontSize: 13 },
});

// ─── Single short card (full-screen reel) ─────────────────────────────────────
function ShortCard({ item, isActive, height, isUnlocked, expiresAt, onLockPress, onViewProfile }) {
  const [paused, setPaused] = useState(false);
  const canPlay = item.is_free || isUnlocked;

  // pause when scrolled away
  const effectivePaused = !isActive || paused;

  return (
    <View style={{ height, width: '100%', backgroundColor: '#000' }}>
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
          ignoreSilentSwitch="obey"
        />
      ) : null}

      {/* Lock overlay for paid+locked */}
      {!canPlay && (
        <TouchableOpacity
          style={s.lockOverlay}
          onPress={() => onLockPress(item)}
          activeOpacity={0.85}
        >
          <View style={s.lockCircle}>
            <MaterialIcons name="lock" size={30} color="#fff" />
          </View>
          <Text style={s.lockLabel}>Tap to subscribe</Text>
          <Text style={s.lockPrice}>₹{item.mentor_profiles?.unlock_price || 299}/mo</Text>
        </TouchableOpacity>
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
          <MaterialIcons name="play-arrow" size={56} color="rgba(255,255,255,0.8)" />
        </View>
      )}

      {/* Bottom gradient — only for playable videos */}
      {canPlay && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.82)']}
          locations={[0.3, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* ── Top-left: mentor info — shown when paused or locked ─────────── */}
      {(paused || !canPlay) && (
        <TouchableOpacity
          style={s.mentorTopRow}
          onPress={() => onViewProfile(item.mentor_id)}
          activeOpacity={0.75}
        >
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <MaterialIcons name="person" size={18} color="#fff" />
            </View>
          )}
          <View style={s.mentorInfo}>
            <Text style={s.mentorName} numberOfLines={1}>{item.profiles?.name || 'Mentor'}</Text>
            {item.mentor_profiles?.specialization ? (
              <Text style={s.mentorSpec} numberOfLines={1}>{item.mentor_profiles.specialization}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      )}

      {/* ── Bottom: title + badge ─────────────────────────────────────────── */}
      <View style={s.cardBottom}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.description ? (
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {!item.is_free && (
          <View style={s.badgeRow}>
            {isUnlocked ? (
              <>
                <View style={s.unlockedBadge}>
                  <MaterialIcons name="check-circle" size={10} color={C.accent.success} />
                  <Text style={s.unlockedBadgeText}>SUBSCRIBED</Text>
                </View>
                {expiresAt ? (
                  <Text style={s.expiryText}>
                    Expires {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                ) : null}
              </>
            ) : (
              <TouchableOpacity style={s.unlockBadge} onPress={() => onLockPress(item)} activeOpacity={0.85}>
                <MaterialIcons name="lock-open" size={10} color={C.accent.primary} />
                <Text style={s.unlockBadgeText}>SUBSCRIBE</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const FILTER_BAR_H = 50;
// CosmicBottomTabBar is position:absolute (floats over content).
// React Navigation does NOT reduce screen height for it, so we subtract manually.
// 88 = bar content height above safe area (matches SafeScreen's bottomTabHeight constant).
const BOTTOM_TAB_H = 88;

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function VideosScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Subtract filter bar + tab bar + device bottom inset so reels don't hide behind nav.
  const reelHeight = windowHeight - FILTER_BAR_H - BOTTOM_TAB_H - insets.bottom;

  const [videos, setVideos]         = useState([]);
  const [unlocksMap, setUnlocksMap] = useState(new Map());
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [lockSheetVideo, setLockSheetVideo] = useState(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems[0] != null) setActiveIndex(viewableItems[0].index ?? 0);
  }, []);

  const viewabilityConfigCallbackPairs = useRef([{
    viewabilityConfig: { itemVisiblePercentThreshold: 60 },
    onViewableItemsChanged,
  }]);

  useEffect(() => {
    loadFeed(false, user?.id);
  }, [user?.id]);

  const loadFeed = async (isRefresh = false, userId = user?.id) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [vids, unlocks] = await Promise.all([
        videoApi.getAllPublicVideos({ excludeMentorId: userId }),
        userId ? videoApi.getLearnerUnlocks(userId) : Promise.resolve(new Map()),
      ]);
      setVideos(vids);
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

  const filtered = videos.filter(v => {
    if (filter === 'free')       return v.is_free;
    if (filter === 'locked')     return !v.is_free && !unlocksMap.has(v.mentor_id);
    if (filter === 'subscribed') return unlocksMap.has(v.mentor_id);
    return true;
  });

  return (
    <View style={s.root}>

      {/* ── Filter chips ──────────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[s.filterScroll, { height: FILTER_BAR_H }]}
        contentContainerStyle={s.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, filter === f.key && s.chipActive]}
            onPress={() => { setFilter(f.key); setActiveIndex(0); }}
            activeOpacity={0.8}
          >
            <MaterialIcons name={f.icon} size={13} color={filter === f.key ? '#000' : C.text.muted} />
            <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Reel feed ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={[s.center, { height: reelHeight }]}>
          <ActivityIndicator size="large" color={C.accent.secondary} />
          <Text style={s.loadingText}>Loading shorts…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={[s.center, { height: reelHeight }]}>
          <MaterialIcons
            name={filter === 'subscribed' ? 'subscriptions' : 'videocam-off'}
            size={44}
            color={C.text.muted}
          />
          <Text style={s.emptyTitle}>
            {filter === 'subscribed' ? 'No subscriptions yet' : 'No videos here'}
          </Text>
          {filter === 'all' && (
            <Text style={s.emptySubtitle}>Mentors will post short videos here</Text>
          )}
        </View>
      ) : (
        <View style={{ height: reelHeight }}>
          <FlatList
            key={filter}
            style={{ flex: 1 }}
            data={filtered}
            keyExtractor={v => v.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            renderItem={({ item, index }) => (
              <ShortCard
                item={item}
                height={reelHeight}
                isActive={index === activeIndex}
                isUnlocked={unlocksMap.has(item.mentor_id)}
                expiresAt={unlocksMap.get(item.mentor_id)?.expiresAt}
                onLockPress={setLockSheetVideo}
                onViewProfile={handleViewProfile}
              />
            )}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
            getItemLayout={(_, index) => ({
              length: reelHeight,
              offset: reelHeight * index,
              index,
            })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadFeed(true, user?.id)}
                tintColor={C.accent.secondary}
              />
            }
          />

          {/* Swipe hint */}
          {filtered.length > 1 && activeIndex === 0 && (
            <View style={s.swipeHint} pointerEvents="none">
              <MaterialIcons name="keyboard-arrow-up" size={20} color="rgba(255,255,255,0.45)" />
              <Text style={s.swipeHintText}>Swipe up for next</Text>
            </View>
          )}
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
    backgroundColor: '#000',
  },

  // ── Filter ────────────────────────────────────────────────────────────────
  filterScroll: {
    flexGrow: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  filterRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  chipActive: {
    backgroundColor: C.accent.secondary,
    borderColor: C.accent.secondary,
  },
  chipText: { color: C.text.muted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000' },

  // ── States ────────────────────────────────────────────────────────────────
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#000',
  },
  loadingText: { color: C.text.muted, fontSize: 14 },
  emptyTitle: { color: C.text.primary, fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: C.text.muted, fontSize: 13 },

  // ── Swipe hint ────────────────────────────────────────────────────────────
  swipeHint: {
    position: 'absolute',
    bottom: 72,
    alignSelf: 'center',
    alignItems: 'center',
  },
  swipeHintText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },

  // ── Short card internals ──────────────────────────────────────────────────
  tapArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockLabel: { color: '#fff', fontWeight: '700', fontSize: 13, marginTop: 10 },
  lockPrice: { color: C.accent.secondary, fontSize: 12, fontWeight: '600', marginTop: 4 },

  pauseIcon: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    zIndex: 3,
  },
  mentorTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
    maxWidth: '70%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 10,
    paddingRight: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  avatarFallback: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorInfo: { flex: 1 },
  mentorName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  mentorSpec: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cardDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 17, marginBottom: 8 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  freeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent.success, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  freeBadgeText: { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(10,6,30,0.75)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)' },
  unlockedBadgeText: { color: C.accent.success, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  unlockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(10,6,30,0.75)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(240,216,117,0.4)' },
  unlockBadgeText: { color: C.accent.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  expiryText: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
});
