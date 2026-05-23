import { SafeScreen } from '../../components/SafeScreen';
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BookingCard } from '../../components/BookingCard';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { normalizeRecordingUrl } from '../../api/api';
import { playbackUrlFromBooking } from '../../api/recordingsApi';
import { scheduleSessionReminder, requestNotificationPermission } from '../../utils/sessionReminder';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const C = T.colors;
const TB = C.tabBar;
const PAGE_SIZE = 6;
const SESSIONS_POLL_MS = 30_000;

const STATUS_LABEL = {
  expired: 'Expired',
  completed: 'Done',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  booked: 'Booked',
  confirmed: 'Live',
  pending: 'Pending',
};

const normalize = b => ({
  ...b,
  recordingUrl: playbackUrlFromBooking(b),
});

const isSessionPast = b => {
  const date = b?.availability_slots?.date;
  const endTime = b?.availability_slots?.end_time;
  if (!date) return false;
  return new Date(`${date}T${endTime || '23:59:59'}`) < new Date();
};

function StatChip({ icon, value, tint }) {
  return (
    <View style={styles.statChip}>
      <View style={[styles.statIconWrap, { backgroundColor: `${tint}16` }]}>
        <MaterialIcons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SectionRow({ icon, title, count }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionIcon}>
          <MaterialIcons name={icon} size={15} color={C.accent.secondary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {count > 0 ? (
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountTxt}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function EmptyBlock({ icon }) {
  return (
    <View style={styles.emptyBlock}>
      <MaterialIcons name={icon} size={26} color={C.text.muted} />
    </View>
  );
}

export default function MentorCallsScreen({ navigation }) {
  const { profile } = useAuth();
  const [upcomingAll, setUpcomingAll] = useState([]);
  const [upcomingShown, setUpcomingShown] = useState(PAGE_SIZE);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const sessionsLoaderShownRef = useRef(false);
  const lastProfileIdRef = useRef(profile?.id);

  const loadInitial = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!profile?.id) return;
    try {
      if (!silent) setLoading(true);
      setUpcomingShown(PAGE_SIZE);

      const [upcomingData, historyData] = await Promise.all([
        bookingApi.getUpcomingBookingsByMentor(profile.id),
        bookingApi.getBookingHistoryByMentor(profile.id, 0, PAGE_SIZE),
      ]);

      const allUpcoming = (upcomingData || []).map(normalize);
      const historyNorm = (historyData || []).map(normalize);
      const upcomingNorm = allUpcoming.filter(b => !isSessionPast(b));
      const expiredNorm = allUpcoming
        .filter(b => isSessionPast(b))
        .map(b => ({ ...b, isExpired: true }));

      setUpcomingAll(upcomingNorm);
      setHistory([...expiredNorm, ...historyNorm]);
      setHistoryPage(1);
      setHasMoreHistory(historyNorm.length === PAGE_SIZE);

      await requestNotificationPermission();
      await Promise.all(
        upcomingNorm.map(b =>
          scheduleSessionReminder({
            bookingId: b.id,
            sessionDate: b.availability_slots?.date,
            sessionTime: b.availability_slots?.start_time,
            mentorName: b.profiles?.name || 'Learner',
            isMentor: true,
          }).catch(() => {}),
        ),
      );
    } catch {
      if (!opts.quietErrors) Toast.show('Could not load');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [profile?.id]);

  const refreshUpcoming = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await bookingApi.getUpcomingBookingsByMentor(profile.id);
      const all = (data || []).map(normalize);
      const stillUpcoming = all.filter(b => !isSessionPast(b));
      const nowExpired = all
        .filter(b => isSessionPast(b))
        .map(b => ({ ...b, isExpired: true }));
      setUpcomingAll(stillUpcoming);
      if (nowExpired.length > 0) {
        setHistory(prev => {
          const ids = new Set(prev.map(b => b.id));
          const fresh = nowExpired.filter(b => !ids.has(b.id));
          return fresh.length ? [...fresh, ...prev] : prev;
        });
      }
    } catch { /* poll */ }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return undefined;
      if (lastProfileIdRef.current !== profile.id) {
        lastProfileIdRef.current = profile.id;
        sessionsLoaderShownRef.current = false;
      }
      if (sessionsLoaderShownRef.current) {
        refreshUpcoming();
      } else {
        loadInitial({ silent: false });
        sessionsLoaderShownRef.current = true;
      }
      const pollId = setInterval(refreshUpcoming, SESSIONS_POLL_MS);
      return () => clearInterval(pollId);
    }, [profile?.id, loadInitial, refreshUpcoming]),
  );

  const loadMoreHistory = useCallback(async () => {
    if (loadingMore || !hasMoreHistory || !profile?.id) return;
    try {
      setLoadingMore(true);
      const data = await bookingApi.getBookingHistoryByMentor(
        profile.id,
        historyPage,
        PAGE_SIZE,
      );
      const newItems = (data || []).map(normalize);
      setHistory(prev => [...prev, ...newItems]);
      setHistoryPage(p => p + 1);
      setHasMoreHistory(newItems.length === PAGE_SIZE);
    } catch {
      Toast.show('Could not load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreHistory, profile?.id, historyPage]);

  const loadMoreUpcoming = () => {
    setUpcomingShown(prev => prev + PAGE_SIZE);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitial({ silent: true, quietErrors: true });
    setRefreshing(false);
  };

  const handleJoinCall = booking => {
    navigation.navigate('VideoCall_Screen', { bookingId: booking.id, isHost: true });
  };

  const handleOpenRecording = rawUrl => {
    const url = normalizeRecordingUrl(rawUrl);
    if (!url) {
      Toast.show('No recording');
      return;
    }
    navigation.navigate(SCREEN_NAMES.RecordingPlayer, { recordingUrl: url });
  };

  const statusKey = item =>
    item.isExpired ? 'expired' : (item.status || 'booked').toLowerCase();

  const renderBooking = (item, isUpcoming) => (
    <BookingCard
      booking={item}
      isMentor
      compact
      showLearnerInfo
      onPressJoin={isUpcoming ? () => handleJoinCall(item) : null}
      onPressCancel={null}
      onPressRecording={
        item.recordingUrl ? () => handleOpenRecording(item.recordingUrl) : null
      }
      statusLabel={STATUS_LABEL[statusKey(item)] || STATUS_LABEL.booked}
    />
  );

  const visibleUpcoming = upcomingAll.slice(0, upcomingShown);
  const hasMoreUpcoming = upcomingAll.length > upcomingShown;
  const completedCount = history.filter(b => b.status === 'completed').length;
  const fullyEmpty = upcomingAll.length === 0 && history.length === 0 && !loading;

  const listData = [{ type: 'stats', key: 'stats' }];

  if (fullyEmpty) {
    listData.push({ type: 'empty', key: 'empty' });
  } else {
    listData.push({
      type: 'section',
      key: 'up_hdr',
      icon: 'event-available',
      title: 'Upcoming',
      count: upcomingAll.length,
    });
    if (!upcomingAll.length) {
      listData.push({ type: 'empty_slot', key: 'up_empty', icon: 'event-busy' });
    } else {
      visibleUpcoming.forEach(b =>
        listData.push({ type: 'booking', key: `u-${b.id}`, item: b, isUpcoming: true }),
      );
      if (hasMoreUpcoming) {
        listData.push({ type: 'load_more_upcoming', key: 'more_upcoming' });
      }
    }

    listData.push({
      type: 'section',
      key: 'hist_hdr',
      icon: 'history',
      title: 'History',
      count: history.length,
    });
    if (!history.length && !loadingMore) {
      listData.push({ type: 'empty_slot', key: 'hist_empty', icon: 'inbox' });
    } else {
      history.forEach(b =>
        listData.push({ type: 'booking', key: `h-${b.id}`, item: b, isUpcoming: false }),
      );
    }

    if (hasMoreHistory) {
      listData.push({ type: 'load_more', key: 'more' });
    }
  }

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'stats':
        return (
          <View style={styles.statsBar}>
            <LinearGradient
              colors={TB.flatBarEdge}
              locations={[0, 0.4, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statsBeam}
              pointerEvents="none"
            />
            <StatChip icon="schedule" value={upcomingAll.length} tint={C.accent.secondary} />
            <View style={styles.statDivider} />
            <StatChip icon="check-circle" value={completedCount} tint={C.accent.success} />
            <View style={styles.statDivider} />
            <StatChip icon="history" value={history.length} tint={C.accent.primary} />
          </View>
        );

      case 'section':
        return (
          <View style={styles.sectionWrap}>
            <SectionRow icon={item.icon} title={item.title} count={item.count} />
          </View>
        );

      case 'empty_slot':
        return <EmptyBlock icon={item.icon} />;

      case 'booking':
        return (
          <View style={styles.cardWrap}>
            {renderBooking(item.item, item.isUpcoming)}
          </View>
        );

      case 'load_more_upcoming':
        return (
          <TouchableOpacity
            style={styles.loadMore}
            onPress={loadMoreUpcoming}
            activeOpacity={0.75}
          >
            <MaterialIcons name="expand-more" size={26} color={C.accent.secondary} />
          </TouchableOpacity>
        );

      case 'load_more':
        return (
          <TouchableOpacity
            style={styles.loadMore}
            onPress={loadMoreHistory}
            activeOpacity={0.75}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={C.accent.secondary} />
            ) : (
              <MaterialIcons name="expand-more" size={26} color={C.accent.secondary} />
            )}
          </TouchableOpacity>
        );

      case 'empty':
        return (
          <View style={styles.emptyMain}>
            <View style={styles.emptyRing}>
              <MaterialIcons name="video-call" size={34} color={C.accent.secondary} />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false} includeTopInset={false}>
      <FlatList
        style={styles.list}
        data={listData}
        keyExtractor={entry => entry.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent.secondary}
          />
        }
      />
      <LoadingOverlay visible={loading && !refreshing} message="" />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: {
    padding: T.spacing.lg,
    paddingBottom: T.spacing.xxxl,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.card,
    paddingVertical: T.spacing.md,
    paddingHorizontal: T.spacing.sm,
    marginBottom: T.spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 3 },
    }),
  },
  statsBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.9,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border.light,
  },
  statValue: {
    ...T.typography.headingSm,
    color: C.text.primary,
    fontWeight: '800',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 38,
    backgroundColor: C.border.light,
    opacity: 0.45,
  },
  sectionWrap: {
    marginTop: T.spacing.sm,
    marginBottom: T.spacing.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(94, 234, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...T.typography.labelMd,
    color: C.text.primary,
    fontWeight: '700',
  },
  sectionCount: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    backgroundColor: C.component.buttonSecondary,
    borderWidth: 1,
    borderColor: C.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountTxt: {
    ...T.typography.labelSm,
    color: C.accent.secondary,
    fontWeight: '800',
  },
  cardWrap: {
    marginBottom: T.spacing.sm,
  },
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.xl,
    marginBottom: T.spacing.sm,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.card,
  },
  loadMore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.md,
    marginTop: T.spacing.xs,
    marginBottom: T.spacing.lg,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.card,
  },
  emptyMain: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl * 1.25,
  },
  emptyRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
