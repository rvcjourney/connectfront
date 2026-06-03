import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { BookingCard } from '../../components/BookingCard';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { playbackUrlFromBooking } from '../../api/recordingsApi';
import { reviewsApi } from '../../api/reviewsApi';
import { normalizeRecordingUrl } from '../../api/api';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { saveRecordingToGallery } from '../../utils/recordingActions';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
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
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });
  return <Animated.View style={[sk.bone, style, { opacity }]} />;
}

function SkeletonBookingCard() {
  return (
    <View style={sk.card}>
      <View style={sk.cardTop}>
        <SkeletonBone style={sk.avatar} />
        <View style={sk.cardMeta}>
          <SkeletonBone style={sk.nameLine} />
          <SkeletonBone style={sk.dateLine} />
          <SkeletonBone style={sk.statusBadge} />
        </View>
        <SkeletonBone style={sk.amountLine} />
      </View>
      <View style={sk.cardActions}>
        <SkeletonBone style={sk.actionBtn} />
        <SkeletonBone style={sk.actionBtn} />
      </View>
    </View>
  );
}

function SkeletonSectionHeader() {
  return (
    <View style={sk.sectionHeader}>
      <SkeletonBone style={sk.sectionTitle} />
      <SkeletonBone style={sk.sectionCount} />
    </View>
  );
}

function BookingsSkeleton() {
  return (
    <View style={sk.wrap}>
      <SkeletonSectionHeader />
      <SkeletonBookingCard />
      <SkeletonBookingCard />
      <SkeletonSectionHeader />
      <SkeletonBookingCard />
      <SkeletonBookingCard />
      <SkeletonBookingCard />
    </View>
  );
}

const sk = StyleSheet.create({
  bone: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },
  wrap: {
    padding: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: UNIFIED_THEME.spacing.sm,
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  sectionTitle: { height: 14, width: 140, borderRadius: 6 },
  sectionCount: { height: 22, width: 28, borderRadius: 8 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: UNIFIED_THEME.spacing.md,
    gap: UNIFIED_THEME.spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: UNIFIED_THEME.spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  cardMeta: { flex: 1, gap: 8 },
  nameLine: { height: 13, width: '65%', borderRadius: 6 },
  dateLine: { height: 11, width: '80%', borderRadius: 6 },
  statusBadge: { height: 20, width: 70, borderRadius: 6 },
  amountLine: { height: 18, width: 52, borderRadius: 6 },
  cardActions: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.sm,
    paddingTop: UNIFIED_THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: UNIFIED_THEME.colors.border.light,
  },
  actionBtn: { flex: 1, height: 36, borderRadius: UNIFIED_THEME.borderRadius.md },
});

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const TEAL = C.accent.secondary;

const PAGE_SIZE = 6;

function SectionHeaderRow({ title, count }) {
  return (
    <View style={styles.secHdrRow}>
      <Text style={styles.secHdrTitle}>{title}</Text>
      {count != null ? (
        <View style={styles.secHdrCount}>
          <Text style={styles.secHdrCountText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function BookingsHero() {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={S.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroIconRing}>
        <LinearGradient
          colors={B.premiumGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroIconRingGrad}
        >
          <View style={styles.heroIconInner}>
            <MaterialIcons name="event-note" size={24} color={PURPLE_LINK} />
          </View>
        </LinearGradient>
      </View>
      <Text style={styles.heroEyebrow}>Sessions</Text>
      <Text style={styles.heroTitle}>My bookings</Text>
      <Text style={styles.heroSubtitle}>
        Join calls on time and review your session history here.
      </Text>
    </View>
  );
}

export default function LearnerBookingsScreen({ navigation }) {
  const { profile } = useAuth();
  const [upcomingAll, setUpcomingAll] = useState([]);
  const [upcomingShown, setUpcomingShown] = useState(PAGE_SIZE);
  const [history, setHistory] = useState([]);
  const [historyShown, setHistoryShown] = useState(PAGE_SIZE);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  useEffect(() => {
    if (profile?.id) loadInitial();
  }, [profile?.id]);

  const loadInitial = async () => {
    if (!profile?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      setHistoryPage(0);
      setHasMoreHistory(true);
      setUpcomingShown(PAGE_SIZE);
      setHistoryShown(PAGE_SIZE);

      const [upcomingData, historyData] = await Promise.all([
        bookingApi.getUpcomingBookingsByLearner(profile.id),
        bookingApi.getBookingHistoryByLearner(profile.id, 0, PAGE_SIZE),
      ]);

      const normalizeBooking = b => ({
        ...b,
        recordingUrl: playbackUrlFromBooking(b),
      });

      const isSessionPast = b => {
        const date = b?.availability_slots?.date;
        const endTime = b?.availability_slots?.end_time;
        if (!date) return false;
        return new Date(`${date}T${endTime || '23:59:59'}`) < new Date();
      };

      const allUpcoming = (upcomingData || []).map(normalizeBooking);
      const historyNorm = (historyData || []).map(normalizeBooking);

      const upcomingNorm = allUpcoming.filter(b => !isSessionPast(b));
      const expiredNorm  = allUpcoming.filter(b => isSessionPast(b))
        .map(b => ({ ...b, isExpired: true }));

      const merged = [...expiredNorm, ...historyNorm].sort((a, b) => {
        const da = `${a.availability_slots?.date ?? ''} ${a.availability_slots?.start_time ?? ''}`;
        const db = `${b.availability_slots?.date ?? ''} ${b.availability_slots?.start_time ?? ''}`;
        return db.localeCompare(da);
      });
      setUpcomingAll(upcomingNorm);
      setHistory(merged);
      setHistoryPage(1);
      setHasMoreHistory(historyNorm.length === PAGE_SIZE);

      // Check which completed bookings have reviews
      const completedIds = historyNorm
        .filter(b => b.status === 'completed')
        .map(b => b.id);
      const reviewed = new Set();
      await Promise.all(
        completedIds.map(async id => {
          const r = await reviewsApi.getReviewForBooking(id);
          if (r) reviewed.add(id);
        }),
      );
      setReviewedIds(reviewed);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Toast.show('Failed to load bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHistory = useCallback(async () => {
    // If there are in-memory items not yet shown, just reveal them
    if (historyShown < history.length) {
      setHistoryShown(prev => prev + PAGE_SIZE);
      return;
    }
    // Otherwise fetch next page from server
    if (loadingMore || !hasMoreHistory || !profile?.id) return;
    try {
      setLoadingMore(true);
      const data = await bookingApi.getBookingHistoryByLearner(profile.id, historyPage, PAGE_SIZE);
      const newItems = (data || []).map(b => ({
        ...b,
        recordingUrl: playbackUrlFromBooking(b),
      }));

      setHistory(prev => [...prev, ...newItems]);
      setHistoryShown(prev => prev + PAGE_SIZE);
      setHistoryPage(p => p + 1);
      setHasMoreHistory(newItems.length === PAGE_SIZE);

      // Check reviews for newly loaded completed bookings
      const completedIds = newItems.filter(b => b.status === 'completed').map(b => b.id);
      if (completedIds.length > 0) {
        const reviewed = new Set(reviewedIds);
        await Promise.all(
          completedIds.map(async id => {
            const r = await reviewsApi.getReviewForBooking(id);
            if (r) reviewed.add(id);
          }),
        );
        setReviewedIds(reviewed);
      }
    } catch {
      Toast.show('Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [historyShown, history.length, loadingMore, hasMoreHistory, profile?.id, historyPage, reviewedIds]);

  const loadMoreUpcoming = () => {
    setUpcomingShown(prev => prev + PAGE_SIZE);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  const handleJoinCall = booking => {
    navigation.navigate('VideoCall_Screen', { bookingId: booking.id, isHost: false });
  };

  const handleCancelBooking = async booking => {
    try {
      await bookingApi.cancelBooking(booking.id);
      Toast.show('Booking cancelled');
      await loadInitial();
    } catch {
      Toast.show('Failed to cancel booking');
    }
  };

  const handleOpenRecording = rawUrl => {
    const url = normalizeRecordingUrl(rawUrl);
    if (!url) { Toast.show('Recording link is unavailable'); return; }
    navigation.navigate(SCREEN_NAMES.RecordingPlayer, { recordingUrl: url });
  };

  const handleDownloadRecording = rawUrl => {
    const url = normalizeRecordingUrl(rawUrl);
    if (!url) {
      Toast.show('Recording link is unavailable');
      return;
    }
    saveRecordingToGallery(url);
  };

  const renderBooking = (item, isUpcoming) => {
    let statusLabel;
    if (item.isExpired) {
      statusLabel = 'Expired';
    } else if (isUpcoming && (item.status === 'pending' || item.status === 'confirmed')) {
      statusLabel = 'Booked';
    } else if (item.status === 'completed') {
      statusLabel = 'Completed';
    } else if (item.status === 'cancelled' || item.status === 'rejected') {
      statusLabel = 'Cancelled';
    } else {
      statusLabel = item.status;
    }

    const canRate = item.status === 'completed' && !reviewedIds.has(item.id);

    return (
      <BookingCard
        key={item.id}
        booking={item}
        isMentor={false}
        onPressJoin={isUpcoming ? () => handleJoinCall(item) : null}
        onPressCancel={isUpcoming ? () => handleCancelBooking(item) : null}
        onPressRecording={item.recordingUrl ? () => handleOpenRecording(item.recordingUrl) : null}
        onPressDownload={
          item.recordingUrl ? () => handleDownloadRecording(item.recordingUrl) : null
        }
        onPressRate={
          canRate
            ? () => navigation.navigate(SCREEN_NAMES.Review, {
                bookingId: item.id,
                mentorId: item.mentor_id,
                mentorName: item.profiles?.name || 'Mentor',
              })
            : null
        }
        statusLabel={statusLabel}
      />
    );
  };

  const visibleUpcoming = upcomingAll.slice(0, upcomingShown);
  const hasMoreUpcoming = upcomingAll.length > upcomingShown;
  const fullyEmpty = upcomingAll.length === 0 && history.length === 0 && !loading;

  // Build FlatList data: hero + upcoming section + history section + history items
  const listData = [];

  listData.push({ type: 'hero', key: 'hero' });

  if (fullyEmpty) {
    listData.push({ type: 'empty', key: 'empty' });
  } else {
    listData.push({ type: 'section_header', key: 'upcoming_header', title: 'Upcoming Sessions', subtitle: 'Join sessions at their scheduled time.', count: upcomingAll.length });
    if (upcomingAll.length === 0) {
      listData.push({ type: 'empty_section', key: 'upcoming_empty', icon: 'event-available', text: 'No upcoming sessions' });
    } else {
      visibleUpcoming.forEach(b => listData.push({ type: 'booking', key: b.id, item: b, isUpcoming: true }));
      if (hasMoreUpcoming) {
        listData.push({ type: 'load_more_upcoming', key: 'load_more_upcoming' });
      }
    }

    const visibleHistory = history.slice(0, historyShown);
    const hasMoreHistoryToShow = historyShown < history.length || hasMoreHistory;

    listData.push({ type: 'section_header', key: 'history_header', title: 'Session History', subtitle: 'A record of your past sessions.', count: history.length });
    if (visibleHistory.length === 0 && !loadingMore) {
      listData.push({ type: 'empty_section', key: 'history_empty', icon: 'history', text: 'No past sessions yet' });
    } else {
      visibleHistory.forEach(b => listData.push({ type: 'booking', key: b.id, item: b, isUpcoming: false }));
    }

    if (hasMoreHistoryToShow) {
      listData.push({ type: 'load_more', key: 'load_more' });
    }
  }

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'hero':
        return <BookingsHero />;

      case 'section_header':
        return (
          <View style={styles.sectionTop}>
            <SectionHeaderRow title={item.title} count={item.count} />
          </View>
        );

      case 'empty_section':
        return (
          <View style={[styles.placeholderCard, styles.sectionItem]}>
            <MaterialIcons name={item.icon} size={22} color={PURPLE_LINK} />
            <Text style={styles.placeholderText}>{item.text}</Text>
          </View>
        );

      case 'booking':
        return (
          <View style={styles.sectionItem}>
            {renderBooking(item.item, item.isUpcoming)}
          </View>
        );

      case 'load_more_upcoming':
        return (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreUpcoming} activeOpacity={0.7}>
            <MaterialIcons name="expand-more" size={20} color={PURPLE_LINK} />
            <Text style={styles.loadMoreTxt}>Load more upcoming</Text>
          </TouchableOpacity>
        );

      case 'load_more':
        return (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreHistory} activeOpacity={0.7}>
            {loadingMore ? (
              <ActivityIndicator size="small" color={TEAL} />
            ) : (
              <>
                <MaterialIcons name="expand-more" size={20} color={PURPLE_LINK} />
                <Text style={styles.loadMoreTxt}>Load more history</Text>
              </>
            )}
          </TouchableOpacity>
        );

      case 'empty':
        return (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconRing}>
              <MaterialIcons name="calendar-month" size={40} color={PURPLE_LINK} />
            </View>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse mentors from Discover and book your first session.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const HeroCard = <BookingsHero />;

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false} includeTopInset={false}>
      {loading ? (
        <View style={{ flex: 1 }}>
          <View style={styles.listContent}>{HeroCard}</View>
          <BookingsSkeleton />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={listData}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={TEAL}
            />
          }
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: T.spacing.lg,
    paddingBottom: T.spacing.xxxl,
  },
  hero: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'flex-start',
    ...Platform.select({ ios: T.shadows.medium, android: { elevation: 6 } }),
  },
  heroIconRing: {
    marginBottom: T.spacing.sm,
  },
  heroIconRingGrad: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary.void,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE_LINK,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.4,
    marginBottom: T.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 13,
    color: C.text.secondary,
    lineHeight: 20,
  },
  sectionTop: {
    marginTop: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  secHdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: T.spacing.xs,
    marginBottom: 2,
  },
  secHdrTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text.primary,
    flex: 1,
    minWidth: 0,
  },
  secHdrCount: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secHdrCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: PURPLE_LINK,
  },
  sectionItem: {
    marginBottom: T.spacing.md,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingVertical: T.spacing.lg,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
  },
  placeholderText: {
    fontSize: 14,
    color: C.text.muted,
    flex: 1,
    fontWeight: '600',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    marginTop: T.spacing.sm,
    marginBottom: T.spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  loadMoreTxt: {
    fontSize: 13,
    color: PURPLE_LINK,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    borderRadius: 16,
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
    fontSize: 17,
    fontWeight: '800',
    color: C.text.primary,
    marginBottom: T.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
