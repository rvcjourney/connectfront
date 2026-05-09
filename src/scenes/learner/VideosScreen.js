import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { videoApi } from '../../api/videoApi';
import { useAuth } from '../../hooks/useAuth';

const T = UNIFIED_THEME;
const C = T.colors;

// ─── Full-screen video player ─────────────────────────────────────────────────
function VideoPlayerModal({ video, onClose }) {
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!video) return null;

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <View style={pStyles.container}>
        <Video
          source={{ uri: video.video_url }}
          style={pStyles.video}
          resizeMode="contain"
          paused={paused}
          onLoadStart={() => { setBuffering(true); setHasError(false); }}
          onLoad={() => setBuffering(false)}
          onError={() => { setBuffering(false); setHasError(true); }}
          repeat={false}
        />
        {buffering && !hasError && (
          <ActivityIndicator style={pStyles.loader} size="large" color={C.accent.secondary} />
        )}
        {hasError && (
          <View style={pStyles.errorBox}>
            <MaterialIcons name="error-outline" size={40} color={C.accent.error} />
            <Text style={pStyles.errorText}>Could not play video</Text>
          </View>
        )}
        <View style={pStyles.topBar}>
          <TouchableOpacity onPress={onClose} style={pStyles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={pStyles.topBarInfo}>
            <Text style={pStyles.topBarTitle} numberOfLines={1}>{video.title}</Text>
            <Text style={pStyles.topBarMentor} numberOfLines={1}>
              {video.profiles?.name}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <TouchableOpacity style={pStyles.tapArea} onPress={() => setPaused(p => !p)} activeOpacity={1}>
          {paused && (
            <View style={pStyles.playCircle}>
              <MaterialIcons name="play-arrow" size={52} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const pStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loader: { position: 'absolute', alignSelf: 'center' },
  errorBox: { alignItems: 'center', gap: 8 },
  errorText: { color: C.accent.error, fontSize: 14 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 16, paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backBtn: { padding: 8, width: 40 },
  topBarInfo: { flex: 1, alignItems: 'center' },
  topBarTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  topBarMentor: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  tapArea: { position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  playCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});

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
      // Step 1: create order server-side (no slotId — video subscription)
      const order = await videoApi.createVideoOrder({
        mentorId:    video.mentor_id,
        learnerId:   user.id,
        amountPaise: price * 100,
      });

      // Step 2: open Razorpay checkout
      const paymentData = await RazorpayCheckout.open({
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency || 'INR',
        name:        'Connect',
        description: `Subscribe to ${mentorName}'s video library`,
        order_id:    order.orderId,
        prefill:     { email: user.email || '' },
        theme:       { color: '#5eead4' },
      });

      // Step 3: verify payment + record subscription + credit mentor wallet
      await videoApi.verifyVideoSubscription({
        razorpayOrderId:   order.orderId,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        mentorId:          video.mentor_id,
        learnerId:         user.id,
        amountPaid:        price,
        mentorAmount:      Math.round(price * 0.8),
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
      <TouchableOpacity style={uStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={uStyles.sheet}>
        <View style={uStyles.handle} />

        <View style={uStyles.mentorRow}>
          {video.profiles?.avatar_url ? (
            <Image source={{ uri: video.profiles.avatar_url }} style={uStyles.avatar} />
          ) : (
            <View style={[uStyles.avatar, uStyles.avatarFallback]}>
              <MaterialIcons name="person" size={22} color={C.accent.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={uStyles.mentorName}>{mentorName}</Text>
            <Text style={uStyles.mentorSpec}>{video.mentor_profiles?.specialization || ''}</Text>
          </View>
          <View style={uStyles.pricePill}>
            <Text style={uStyles.priceText}>₹{price}</Text>
          </View>
        </View>

        <View style={uStyles.divider} />

        <Text style={uStyles.sheetTitle}>Subscribe to video library</Text>
        <Text style={uStyles.sheetSub}>
          Monthly subscription · Access all of {mentorName}'s videos
        </Text>

        <View style={uStyles.perks}>
          {['All current videos', 'All future uploads', 'Cancel anytime'].map(p => (
            <View key={p} style={uStyles.perkRow}>
              <MaterialIcons name="check-circle" size={16} color={C.accent.success} />
              <Text style={uStyles.perkText}>{p}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[uStyles.payBtn, loading && { opacity: 0.6 }]}
          onPress={handleUnlock}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.accent.secondary, C.accent.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={uStyles.payBtnInner}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={uStyles.payBtnText}>Subscribe · ₹{price}/mo</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={uStyles.cancelBtn}>
          <Text style={uStyles.cancelText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const uStyles = StyleSheet.create({
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
  sheetTitle: { color: C.text.primary, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sheetSub: { color: C.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  perks: { gap: 10, marginBottom: 24 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { color: C.text.secondary, fontSize: 13 },
  payBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  payBtnInner: { paddingVertical: 15, alignItems: 'center' },
  payBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: C.text.muted, fontSize: 13 },
});

// ─── Video feed card ──────────────────────────────────────────────────────────
function VideoCard({ item, isUnlocked, expiresAt, onPlay, onLockPress }) {
  const canPlay = item.is_free || isUnlocked;
  const avatarUrl = item.profiles?.avatar_url;
  const mentorName = item.profiles?.name || 'Mentor';
  const firstName = mentorName.split(' ')[0];

  const gradientColors = canPlay
    ? ['#0d4f4a', '#0d3d3a', '#0b2d2c']
    : ['#1a1035', '#120c2a', '#0c0820'];

  return (
    <View style={cStyles.card}>
      <TouchableOpacity onPress={() => canPlay ? onPlay(item) : onLockPress(item)} activeOpacity={0.88}>
        <LinearGradient colors={gradientColors} style={cStyles.thumb}>
          <View style={cStyles.playCircle}>
            <MaterialIcons
              name={canPlay ? 'play-arrow' : 'lock'}
              size={canPlay ? 32 : 24}
              color={canPlay ? C.accent.secondary : 'rgba(255,255,255,0.5)'}
            />
          </View>

          {item.is_free ? (
            <View style={cStyles.freeBadge}>
              <MaterialIcons name="play-circle-filled" size={10} color="#000" />
              <Text style={cStyles.freeBadgeText}>FREE</Text>
            </View>
          ) : !isUnlocked ? (
            <View style={cStyles.lockedBadge}>
              <MaterialIcons name="lock" size={10} color={C.accent.primary} />
              <Text style={cStyles.lockedBadgeText}>LOCKED</Text>
            </View>
          ) : (
            <View style={cStyles.unlockedBadge}>
              <MaterialIcons name="check-circle" size={10} color={C.accent.success} />
              <Text style={cStyles.unlockedBadgeText}>SUBSCRIBED</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={cStyles.info}>
        <View style={cStyles.mentorRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={cStyles.avatar} />
          ) : (
            <View style={[cStyles.avatar, cStyles.avatarFallback]}>
              <MaterialIcons name="person" size={12} color={C.accent.secondary} />
            </View>
          )}
          <Text style={cStyles.mentorName} numberOfLines={1}>{mentorName}</Text>
        </View>

        <Text style={cStyles.title} numberOfLines={2}>{item.title}</Text>
        {item.description ? (
          <Text style={cStyles.desc} numberOfLines={1}>{item.description}</Text>
        ) : null}

        <TouchableOpacity
          style={[cStyles.actionBtn, !canPlay && cStyles.actionBtnLocked]}
          onPress={() => canPlay ? onPlay(item) : onLockPress(item)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={canPlay ? 'play-circle-filled' : 'lock-open'}
            size={15}
            color={canPlay ? C.accent.secondary : C.accent.primary}
          />
          <Text style={[cStyles.actionText, !canPlay && { color: C.accent.primary }]}>
            {canPlay ? 'Watch now' : 'Unlock Library'}
          </Text>
        </TouchableOpacity>
        {!canPlay && (
          <Text style={cStyles.unlockHint}>
            Unlocks all of {firstName}'s videos for 1 month
          </Text>
        )}
        {isUnlocked && expiresAt && (
          <Text style={cStyles.expiryHint}>
            Expires {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>
    </View>
  );
}

const cStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },

  thumb: { height: 180, justifyContent: 'center', alignItems: 'center' },

  playCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  freeBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.accent.success, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  freeBadgeText: { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  lockedBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(10,6,30,0.75)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(240,216,117,0.4)' },
  lockedBadgeText: { color: C.accent.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  unlockedBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(10,6,30,0.75)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)' },
  unlockedBadgeText: { color: C.accent.success, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

  info: { padding: 12, paddingTop: 10 },
  mentorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  avatarFallback: { backgroundColor: 'rgba(94,234,212,0.15)', alignItems: 'center', justifyContent: 'center' },
  mentorName: { color: C.text.muted, fontSize: 12, fontWeight: '600', flex: 1 },
  title: { color: C.text.primary, fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 3 },
  desc: { color: C.text.muted, fontSize: 12, marginBottom: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(94,234,212,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(94,234,212,0.22)' },
  actionBtnLocked: { backgroundColor: 'rgba(240,216,117,0.08)', borderColor: 'rgba(240,216,117,0.25)' },
  actionText: { color: C.accent.secondary, fontSize: 12, fontWeight: '700' },
  unlockHint: { color: C.text.muted, fontSize: 10, marginTop: 5 },
  expiryHint: { color: '#5eead4', fontSize: 10, marginTop: 3, opacity: 0.8 },
});

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'free', label: 'Free', icon: 'play-circle-filled' },
  { key: 'locked', label: 'Locked', icon: 'lock' },
  { key: 'subscribed', label: 'Subscribed', icon: 'check-circle' },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function VideosScreen() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [unlocksMap, setUnlocksMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [lockSheetVideo, setLockSheetVideo] = useState(null);

  useEffect(() => {
    loadFeed(false, user?.id);
  }, [user?.id]);

  const loadFeed = async (isRefresh = false, userId = user?.id) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [vids, unlocks] = await Promise.all([
        videoApi.getAllPublicVideos({ excludeMentorId: userId }),
        userId ? videoApi.getLearnerUnlocks(userId) : Promise.resolve(new Set()),
      ]);
      setVideos(vids);
      setUnlocksMap(unlocks);
    } catch {
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

  const filtered = videos.filter(v => {
    if (filter === 'free') return v.is_free;
    if (filter === 'locked') return !v.is_free && !unlocksMap.has(v.mentor_id);
    if (filter === 'subscribed') return unlocksMap.has(v.mentor_id);
    return true;
  });

  return (
    <SafeScreen scrollable={false} padding={0} includeTopInset={false} hasBottomTabs={false}>
      {/* Filter chips */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, filter === f.key && s.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={f.icon}
              size={13}
              color={filter === f.key ? '#000' : C.text.muted}
            />
            <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.accent.secondary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <MaterialIcons
            name={filter === 'subscribed' ? 'subscriptions' : 'videocam-off'}
            size={40}
            color={C.text.muted}
          />
          <Text style={s.emptyText}>
            {filter === 'subscribed' ? 'No subscriptions yet' : 'No videos yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={v => v.id}
          renderItem={({ item }) => (
            <VideoCard
              item={item}
              isUnlocked={unlocksMap.has(item.mentor_id)}
              expiresAt={unlocksMap.get(item.mentor_id)?.expiresAt}
              onPlay={setPlayingVideo}
              onLockPress={setLockSheetVideo}
            />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed(true, user?.id)}
              tintColor={C.accent.secondary}
            />
          }
        />
      )}

      <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      <UnlockSheet
        video={lockSheetVideo}
        onClose={() => setLockSheetVideo(null)}
        onUnlocked={handleUnlocked}
      />
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: C.accent.secondary,
    borderColor: C.accent.secondary,
  },
  chipText: { color: C.text.muted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  list: { paddingTop: 4, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: C.text.muted, fontSize: 14 },
});
