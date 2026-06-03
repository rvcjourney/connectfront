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
import { saveRecordingToGallery } from '../../utils/recordingActions';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const TEAL = C.accent.secondary;
const GOLD = C.accent.primary;
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

function SessionsHero() {
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
            <MaterialIcons name="video-call" size={24} color={PURPLE_LINK} />
          </View>
        </LinearGradient>
      </View>
      <Text style={styles.heroEyebrow}>Mentor</Text>
      <Text style={styles.heroTitle}>Sessions</Text>
      <Text style={styles.heroSubtitle}>
        Start calls on time and review your session history.
      </Text>
    </View>
  );
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

function SectionHeaderRow({ title, count }) {
  return (
    <View style={styles.secHdrRow}>
      <Text style={styles.secHdrTitle}>{title}</Text>
      {count > 0 ? (
        <View style={styles.secHdrCount}>
          <Text style={styles.secHdrCountText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function EmptyBlock({ icon, text }) {
  return (
    <View style={styles.emptyBlock}>
      <MaterialIcons name={icon} size={22} color={PURPLE_LINK} />
      {text ? <Text style={styles.emptyBlockText}>{text}</Text> : null}
    </View>
  );
}

export default function MentorCallsScreen({ navigation }) {
  const { profile } = useAuth();
  const [upcomingAll, setUpcomingAll] = useState([]);
  const [upcomingShown, setUpcomingShown] = useState(PAGE_SIZE);
  const [history, setHistory] = useState([]);
  const [historyShown, setHistoryShown] = useState(PAGE_SIZE);
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
      setHistoryShown(PAGE_SIZE);

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

      const merged = [...expiredNorm, ...historyNorm].sort((a, b) => {
        const da = `${a.availability_slots?.date ?? ''} ${a.availability_slots?.start_time ?? ''}`;
        const db = `${b.availability_slots?.date ?? ''} ${b.availability_slots?.start_time ?? ''}`;
        return db.localeCompare(da);
      });
      setUpcomingAll(upcomingNorm);
      setHistory(merged);
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
    if (loadingMore || !profile?.id) return;
    if (historyShown < history.length) {
      setHistoryShown(prev => prev + PAGE_SIZE);
      return;
    }
    if (!hasMoreHistory) return;
    try {
      setLoadingMore(true);
      const data = await bookingApi.getBookingHistoryByMentor(
        profile.id,
        historyPage,
        PAGE_SIZE,
      );
      const newItems = (data || []).map(normalize);
      setHistory(prev => [...prev, ...newItems]);
      setHistoryShown(prev => prev + PAGE_SIZE);
      setHistoryPage(p => p + 1);
      setHasMoreHistory(newItems.length === PAGE_SIZE);
    } catch {
      Toast.show('Could not load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreHistory, historyShown, history.length, profile?.id, historyPage]);

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

  const handleDownloadRecording = rawUrl => {
    const url = normalizeRecordingUrl(rawUrl);
    if (!url) {
      Toast.show('No recording');
      return;
    }
    saveRecordingToGallery(url);
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
      onPressDownload={
        item.recordingUrl ? () => handleDownloadRecording(item.recordingUrl) : null
      }
      statusLabel={STATUS_LABEL[statusKey(item)] || STATUS_LABEL.booked}
    />
  );

  const visibleUpcoming = upcomingAll.slice(0, upcomingShown);
  const hasMoreUpcoming = upcomingAll.length > upcomingShown;
  const completedCount = history.filter(b => b.status === 'completed').length;
  const fullyEmpty = upcomingAll.length === 0 && history.length === 0 && !loading;

  const listData = [{ type: 'hero', key: 'hero' }, { type: 'stats', key: 'stats' }];

  if (fullyEmpty) {
    listData.push({ type: 'empty', key: 'empty' });
  } else {
    listData.push({
      type: 'section',
      key: 'up_hdr',
      title: 'Upcoming',
      count: upcomingAll.length,
    });
    if (!upcomingAll.length) {
      listData.push({ type: 'empty_slot', key: 'up_empty', icon: 'event-busy', text: 'No upcoming sessions' });
    } else {
      visibleUpcoming.forEach(b =>
        listData.push({ type: 'booking', key: `u-${b.id}`, item: b, isUpcoming: true }),
      );
      if (hasMoreUpcoming) {
        listData.push({ type: 'load_more_upcoming', key: 'more_upcoming' });
      }
    }

    const visibleHistory = history.slice(0, historyShown);
    const hasMoreHistoryToShow = historyShown < history.length || hasMoreHistory;

    listData.push({
      type: 'section',
      key: 'hist_hdr',
      title: 'History',
      count: history.length,
    });
    if (!visibleHistory.length && !loadingMore) {
      listData.push({ type: 'empty_slot', key: 'hist_empty', icon: 'inbox', text: 'No past sessions yet' });
    } else {
      visibleHistory.forEach(b =>
        listData.push({ type: 'booking', key: `h-${b.id}`, item: b, isUpcoming: false }),
      );
    }

    if (hasMoreHistoryToShow) {
      listData.push({ type: 'load_more', key: 'more' });
    }
  }

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'hero':
        return <SessionsHero />;

      case 'stats':
        return (
          <View style={styles.statsBar}>
            <StatSegment
              icon="schedule"
              iconColor={TEAL}
              value={String(upcomingAll.length)}
              label="Upcoming"
            />
            <View style={styles.statDivider} />
            <StatSegment
              icon="check-circle"
              iconColor={GOLD}
              value={String(completedCount)}
              label="Done"
            />
            <View style={styles.statDivider} />
            <StatSegment
              icon="history"
              iconColor={PURPLE_LINK}
              value={String(history.length)}
              label="History"
            />
          </View>
        );

      case 'section':
        return (
          <View style={styles.sectionWrap}>
            <SectionHeaderRow title={item.title} count={item.count} />
          </View>
        );

      case 'empty_slot':
        return <EmptyBlock icon={item.icon} text={item.text} />;

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
            <MaterialIcons name="expand-more" size={20} color={PURPLE_LINK} />
            <Text style={styles.loadMoreTxt}>Load more upcoming</Text>
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
          <View style={styles.emptyMain}>
            <View style={styles.emptyRing}>
              <MaterialIcons name="video-call" size={34} color={PURPLE_LINK} />
            </View>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySubtitle}>
              When learners book with you, sessions will appear here.
            </Text>
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
            tintColor={TEAL}
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
  hero: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: T.spacing.lg,
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
    fontSize: 17,
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
  sectionWrap: {
    marginTop: T.spacing.sm,
    marginBottom: T.spacing.xs,
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
  cardWrap: {
    marginBottom: T.spacing.sm,
  },
  emptyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    paddingVertical: T.spacing.lg,
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  emptyBlockText: {
    fontSize: 14,
    color: C.text.muted,
    flex: 1,
    fontWeight: '600',
  },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    marginTop: T.spacing.xs,
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
  emptyMain: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  emptyRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    backgroundColor: S.accentViolet,
    alignItems: 'center',
    justifyContent: 'center',
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
