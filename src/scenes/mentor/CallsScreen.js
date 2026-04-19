import { SafeScreen } from '../../components/SafeScreen';
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BookingCard } from '../../components/BookingCard';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { normalizeRecordingUrl } from '../../api/api';
import { scheduleSessionReminder, requestNotificationPermission } from '../../utils/sessionReminder';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const TB = T.colors.tabBar;
const PAGE_SIZE = 10;
const SESSIONS_POLL_MS = 30_000;

const normalize = b => ({
  ...b,
  recordingUrl: b?.recording_playback_url || b?.recording_url || null,
});

export default function MentorCallsScreen({ navigation }) {
  const { profile } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
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
    const quietErrors = opts.quietErrors === true;
    if (!profile?.id) return;
    try {
      if (!silent) setLoading(true);

      const [upcomingData, historyData] = await Promise.all([
        bookingApi.getUpcomingBookingsByMentor(profile.id),
        bookingApi.getBookingHistoryByMentor(profile.id, 0, PAGE_SIZE),
      ]);

      const upcomingNorm = (upcomingData || []).map(normalize);
      const historyNorm = (historyData || []).map(normalize);

      setUpcoming(upcomingNorm);
      setHistory(historyNorm);
      setHistoryPage(1);
      setHasMoreHistory(historyNorm.length === PAGE_SIZE);

      // Schedule reminders for upcoming confirmed bookings
      await requestNotificationPermission();
      await Promise.all(
        upcomingNorm.map(b =>
          scheduleSessionReminder({
            bookingId:   b.id,
            sessionDate: b.availability_slots?.date,
            sessionTime: b.availability_slots?.start_time,
            mentorName:  b.profiles?.name || 'Learner',
            isMentor:    true,
          }).catch(() => {}),
        ),
      );
    } catch (error) {
      if (!quietErrors) Toast.show('Failed to load sessions');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [profile?.id]);

  const refreshUpcoming = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await bookingApi.getUpcomingBookingsByMentor(profile.id);
      setUpcoming((data || []).map(normalize));
    } catch { /* silent poll */ }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return undefined;

      if (lastProfileIdRef.current !== profile.id) {
        lastProfileIdRef.current = profile.id;
        sessionsLoaderShownRef.current = false;
      }

      const silent = sessionsLoaderShownRef.current;
      if (silent) {
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
      const data = await bookingApi.getBookingHistoryByMentor(profile.id, historyPage, PAGE_SIZE);
      const newItems = (data || []).map(normalize);
      setHistory(prev => [...prev, ...newItems]);
      setHistoryPage(p => p + 1);
      setHasMoreHistory(newItems.length === PAGE_SIZE);
    } catch {
      Toast.show('Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreHistory, profile?.id, historyPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitial({ silent: true });
    setRefreshing(false);
  };

  const handleJoinCall = booking => {
    navigation.navigate('VideoCall_Screen', { bookingId: booking.id, isHost: true });
  };

  const handleOpenRecording = rawUrl => {
    const url = normalizeRecordingUrl(rawUrl);
    if (!url) { Toast.show('Recording link is unavailable'); return; }
    navigation.navigate(SCREEN_NAMES.RecordingPlayer, { recordingUrl: url });
  };

  const renderBooking = (item, isUpcoming) => (
    <BookingCard
      key={item.id}
      booking={item}
      isMentor={true}
      showLearnerInfo={true}
      onPressJoin={isUpcoming ? () => handleJoinCall(item) : null}
      onPressCancel={null}
      onPressRecording={item.recordingUrl ? () => handleOpenRecording(item.recordingUrl) : null}
      statusLabel={
        item.status === 'pending' || item.status === 'confirmed' ? 'Booked' : item.status
      }
    />
  );

  const completedCount = history.filter(b => b.status === 'completed').length;
  const fullyEmpty = upcoming.length === 0 && history.length === 0 && !loading;

  // Build FlatList sections
  const listData = [];

  listData.push({ type: 'hero', key: 'hero' });

  if (fullyEmpty) {
    listData.push({ type: 'empty', key: 'empty' });
  } else {
    listData.push({ type: 'section_header', key: 'upcoming_hdr', title: 'Upcoming sessions', subtitle: 'Start your sessions at their scheduled time.', count: upcoming.length });
    if (upcoming.length === 0) {
      listData.push({ type: 'empty_section', key: 'upcoming_empty', icon: 'inbox', text: 'Nothing scheduled yet.' });
    } else {
      upcoming.forEach(b => listData.push({ type: 'booking', key: b.id, item: b, isUpcoming: true }));
    }

    listData.push({ type: 'section_header', key: 'history_hdr', title: 'Session history', subtitle: 'A record of your past sessions.', count: history.length });
    if (history.length === 0 && !loadingMore) {
      listData.push({ type: 'empty_section', key: 'history_empty', icon: 'history', text: 'No past sessions in this list.' });
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
          <View style={styles.hero} testID="mentor-calls-hero">
            <LinearGradient
              colors={TB.flatBarEdge}
              locations={[0, 0.4, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroBeam}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['rgba(94, 234, 212, 0.1)', 'rgba(167, 139, 250, 0.1)', 'rgba(2, 0, 20, 0.65)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.heroIconTile}>
              <MaterialIcons name="video-call" size={24} color={T.colors.accent.secondary} />
            </View>
            <Text style={styles.eyebrow}>Sessions</Text>
            <Text style={styles.pageTitle}>Mentor call center</Text>
            <Text style={styles.pageSubtitle}>
              Manage upcoming calls, session history, and recordings from one place.
            </Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>{upcoming.length}</Text>
                <Text style={styles.heroStatLabel}>Upcoming</Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>{completedCount}</Text>
                <Text style={styles.heroStatLabel}>Completed</Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>{history.length}</Text>
                <Text style={styles.heroStatLabel}>History</Text>
              </View>
            </View>
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
          <View style={[styles.emptyInline, styles.sectionItem]}>
            <MaterialIcons name={item.icon} size={20} color={T.colors.text.muted} />
            <Text style={styles.emptyInlineText}>{item.text}</Text>
          </View>
        );

      case 'booking':
        return <View style={styles.sectionItem}>{renderBooking(item.item, item.isUpcoming)}</View>;

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
          <View style={styles.emptyHero}>
            <View style={styles.emptyHeroIcon}>
              <MaterialIcons name="video-call" size={32} color={T.colors.accent.secondary} />
            </View>
            <Text style={styles.emptyHeroTitle}>No sessions yet</Text>
            <Text style={styles.emptyHeroSub}>
              When learners book you, upcoming sessions appear here with a start call action.
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
      <LoadingOverlay visible={loading && !refreshing} message="Loading sessions…" />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: T.spacing.lg,
    paddingBottom: T.spacing.xxxl,
  },
  hero: {
    borderRadius: T.borderRadius.sm,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
    backgroundColor: T.colors.primary.dark,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 3 },
    }),
  },
  heroBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.9,
    zIndex: 1,
  },
  heroIconTile: {
    width: 48,
    height: 48,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.md,
    zIndex: 1,
  },
  eyebrow: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: T.spacing.xs,
    fontWeight: '700',
    zIndex: 1,
  },
  pageTitle: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.sm,
    zIndex: 1,
  },
  pageSubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    lineHeight: 22,
    marginBottom: T.spacing.md,
    zIndex: 1,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    zIndex: 1,
  },
  heroStatCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.sm + 2,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroStatValue: {
    ...T.typography.labelLg,
    color: T.colors.text.primary,
    fontWeight: '800',
  },
  heroStatLabel: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    marginTop: 2,
  },
  sectionTop: {
    marginTop: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  sectionItem: {
    marginBottom: T.spacing.md,
  },
  emptyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.sm,
    paddingVertical: T.spacing.lg,
    paddingHorizontal: T.spacing.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.border.default,
  },
  emptyInlineText: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    flex: 1,
    lineHeight: 20,
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
  emptyHero: {
    alignItems: 'center',
    paddingVertical: T.spacing.xxxl,
    paddingHorizontal: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.card,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accent.secondary,
    marginBottom: T.spacing.lg,
  },
  emptyHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: T.borderRadius.sm,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.md,
  },
  emptyHeroTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    fontWeight: '700',
  },
  emptyHeroSub: {
    ...T.typography.bodyMd,
    color: T.colors.text.muted,
    textAlign: 'center',
    marginTop: T.spacing.sm,
    lineHeight: 22,
    maxWidth: 300,
  },
});
