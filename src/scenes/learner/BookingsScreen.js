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
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { playbackUrlFromBooking } from '../../api/recordingsApi';
import { reviewsApi } from '../../api/reviewsApi';
import { normalizeRecordingUrl } from '../../api/api';
import { SCREEN_NAMES } from '../../navigators/screenNames';

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
    backgroundColor: UNIFIED_THEME.colors.border.default,
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
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
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
const PAGE_SIZE = 10;

export default function LearnerBookingsScreen({ navigation }) {
  const { profile } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
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

      setUpcoming(upcomingNorm);
      setHistory([...expiredNorm, ...historyNorm]);
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
    if (loadingMore || !hasMoreHistory || !profile?.id) return;
    try {
      setLoadingMore(true);
      const data = await bookingApi.getBookingHistoryByLearner(profile.id, historyPage, PAGE_SIZE);
      const newItems = (data || []).map(b => ({
        ...b,
        recordingUrl: playbackUrlFromBooking(b),
      }));

      setHistory(prev => [...prev, ...newItems]);
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
  }, [loadingMore, hasMoreHistory, profile?.id, historyPage, reviewedIds]);

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

  const fullyEmpty = upcoming.length === 0 && history.length === 0 && !loading;

  // Build FlatList data: hero + upcoming section + history section + history items
  const listData = [];

  listData.push({ type: 'hero', key: 'hero' });

  if (fullyEmpty) {
    listData.push({ type: 'empty', key: 'empty' });
  } else {
    listData.push({ type: 'section_header', key: 'upcoming_header', title: 'Upcoming Sessions', subtitle: 'Join sessions at their scheduled time.', count: upcoming.length });
    if (upcoming.length === 0) {
      listData.push({ type: 'empty_section', key: 'upcoming_empty', icon: 'event-available', text: 'No upcoming sessions' });
    } else {
      upcoming.forEach(b => listData.push({ type: 'booking', key: b.id, item: b, isUpcoming: true }));
    }

    listData.push({ type: 'section_header', key: 'history_header', title: 'Session History', subtitle: 'A record of your past sessions.', count: history.length });
    if (history.length === 0 && !loadingMore) {
      listData.push({ type: 'empty_section', key: 'history_empty', icon: 'history', text: 'No past sessions yet' });
    } else {
      history.forEach(b => listData.push({ type: 'booking', key: b.id, item: b, isUpcoming: false }));
    }

    if (hasMoreHistory) {
      listData.push({ type: 'load_more', key: 'load_more' });
    }
  }

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'hero':
        return (
          <View style={styles.hero}>
            <LinearGradient
              colors={['rgba(94, 234, 212, 0.14)', 'rgba(167, 139, 250, 0.12)', 'rgba(2, 0, 20, 0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroRim} pointerEvents="none" />
            <View style={styles.heroIconRow}>
              <MaterialIcons name="menu-book" size={22} color={T.colors.accent.secondary} />
            </View>
            <Text style={styles.heroTitle}>My bookings</Text>
            <Text style={styles.heroSubtitle}>
              Join calls on time, and review your session history here.
            </Text>
          </View>
        );

      case 'section_header':
        return (
          <View style={styles.sectionTop}>
            <SectionHeader title={item.title} subtitle={item.subtitle} count={item.count} />
          </View>
        );

      case 'empty_section':
        return (
          <View style={[styles.placeholderCard, styles.sectionItem]}>
            <MaterialIcons name={item.icon} size={22} color={T.colors.text.muted} />
            <Text style={styles.placeholderText}>{item.text}</Text>
          </View>
        );

      case 'booking':
        return (
          <View style={styles.sectionItem}>
            {renderBooking(item.item, item.isUpcoming)}
          </View>
        );

      case 'load_more':
        return (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreHistory} activeOpacity={0.7}>
            {loadingMore ? (
              <ActivityIndicator size="small" color={T.colors.accent.secondary} />
            ) : (
              <>
                <MaterialIcons name="expand-more" size={20} color={T.colors.accent.secondary} />
                <Text style={styles.loadMoreTxt}>Load more history</Text>
              </>
            )}
          </TouchableOpacity>
        );

      case 'empty':
        return (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="calendar-month" size={40} color={T.colors.accent.primary} />
            </View>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse mentors from Search and book your first session.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const HeroCard = (
    <View style={styles.hero}>
      <LinearGradient
        colors={['rgba(94, 234, 212, 0.14)', 'rgba(167, 139, 250, 0.12)', 'rgba(2, 0, 20, 0.5)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroRim} pointerEvents="none" />
      <View style={styles.heroIconRow}>
        <MaterialIcons name="menu-book" size={22} color={T.colors.accent.secondary} />
      </View>
      <Text style={styles.heroTitle}>My bookings</Text>
      <Text style={styles.heroSubtitle}>
        Join calls on time, and review your session history here.
      </Text>
    </View>
  );

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
              tintColor={T.colors.accent.secondary}
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
    borderRadius: T.borderRadius.xl,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.primary.dark,
    ...Platform.select({
      ios: T.shadows.medium,
      android: { elevation: 6 },
    }),
  },
  heroRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: T.borderRadius.xl,
    borderWidth: 1,
    borderColor: T.colors.tabBar.rimBorder,
    margin: 1,
  },
  heroIconRow: {
    marginBottom: T.spacing.sm,
  },
  heroTitle: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    marginBottom: T.spacing.sm,
  },
  heroSubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    lineHeight: 22,
  },
  sectionTop: {
    marginTop: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  sectionItem: {
    marginBottom: T.spacing.md,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    paddingVertical: T.spacing.lg,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  placeholderText: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    flex: 1,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    marginTop: T.spacing.sm,
    marginBottom: T.spacing.lg,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
  },
  loadMoreTxt: {
    ...T.typography.bodySm,
    color: T.colors.accent.secondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: T.colors.component.card,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.lg,
  },
  emptyTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    marginBottom: T.spacing.sm,
  },
  emptySubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
