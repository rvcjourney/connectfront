import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { useFocusEffect } from '@react-navigation/native';
import { SafeScreen } from '../../components/SafeScreen';
import { CapsuleTabBar } from '../../components/CapsuleTabBar';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BookingCard } from '../../components/BookingCard';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import {
  getToken,
  fetchRecordingUrls,
  normalizeRecordingUrl,
  isTokenEndpointConfigured,
} from '../../api/api';
import { playbackUrlFromBooking, pickRecordingRow } from '../../api/recordingsApi';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const T = UNIFIED_THEME;
const TopTab = createMaterialTopTabNavigator();

const TAB_MENTOR = 'RecordedLectures_MentorTab';
const TAB_LEARNER = 'RecordedLectures_LearnerTab';

const RecordingsContext = createContext(null);

function useRecordingsContext() {
  const ctx = useContext(RecordingsContext);
  if (!ctx) {
    throw new Error('useRecordingsContext must be used within RecordedLecturesScreen');
  }
  return ctx;
}

async function enrichBookingsWithRecordings(bookings, token) {
  const enrichedGroups = await Promise.all(
    (bookings || []).map(async booking => {
      const existing = playbackUrlFromBooking(booking);
      if (existing) {
        return [{ ...booking, recordingUrl: existing, recordingIndex: 0 }];
      }

      const rec = pickRecordingRow(booking);
      const meetingId = rec?.meeting_id;
      if (!token || !meetingId || booking?.status !== 'completed') {
        return [];
      }

      const urls = await fetchRecordingUrls({
        meetingId,
        token,
      });

      return urls.map((recordingUrl, idx) => ({
        ...booking,
        id: `${booking.id}-rec-${idx}`,
        recordingUrl,
        recordingIndex: idx,
      }));
    }),
  );

  return enrichedGroups.flat();
}

const tabIcon =
  name =>
  ({ color, focused }) =>
    (
      <MaterialIcons
        name={name}
        size={focused ? 22 : 20}
        color={color}
      />
    );

function MentorRecordingsTab() {
  const { mentorWithRecordings, refreshing, onRefresh, openRecording } = useRecordingsContext();

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.colors.accent.primary} />
      }
    >
      <Text style={styles.tabHint}>Sessions you hosted — recordings with your learners.</Text>
      {mentorWithRecordings.length > 0 ? (
        <View style={styles.cards}>
          {mentorWithRecordings.map(item => (
            <BookingCard
              key={item.id}
              booking={item}
              isMentor
              showLearnerInfo
              onPressJoin={null}
              onPressCancel={null}
              onPressRecording={() => openRecording(item.recordingUrl)}
              statusLabel="Recorded"
            />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <MaterialIcons name="school" size={28} color={T.colors.text.muted} />
          <Text style={styles.emptyText}>No mentor recordings yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

function LearnerRecordingsTab() {
  const { learnerWithRecordings, refreshing, onRefresh, openRecording } = useRecordingsContext();

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.colors.accent.primary} />
      }
    >
      <Text style={styles.tabHint}>Sessions you attended — recordings with your mentors.</Text>
      {learnerWithRecordings.length > 0 ? (
        <View style={styles.cards}>
          {learnerWithRecordings.map(item => (
            <BookingCard
              key={item.id}
              booking={item}
              isMentor={false}
              onPressJoin={null}
              onPressCancel={null}
              onPressRecording={() => openRecording(item.recordingUrl)}
              statusLabel="Recorded"
            />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <MaterialIcons name="menu-book" size={28} color={T.colors.text.muted} />
          <Text style={styles.emptyText}>No learner recordings yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

async function getTokenWithTimeout(timeoutMs = 6000) {
  if (!isTokenEndpointConfigured) {
    return null;
  }

  return Promise.race([
    getToken(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Token request timed out')), timeoutMs),
    ),
  ]);
}

export default function RecordedLecturesScreen({ navigation }) {
  const { profile } = useAuth();
  const [mentorWithRecordings, setMentorWithRecordings] = useState([]);
  const [learnerWithRecordings, setLearnerWithRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;

    // Phase 1: load DB rows immediately — show recordings already stored
    const [mentorRows, learnerRows] = await Promise.all([
      bookingApi.getBookingsByMentor(profile.id),
      bookingApi.getBookingsByLearner(profile.id),
    ]);

    const quickMentor = (mentorRows || [])
      .map(b => ({ ...b, recordingUrl: playbackUrlFromBooking(b) }))
      .filter(b => b.recordingUrl);
    const quickLearner = (learnerRows || [])
      .map(b => ({ ...b, recordingUrl: playbackUrlFromBooking(b) }))
      .filter(b => b.recordingUrl);

    setMentorWithRecordings(quickMentor);
    setLearnerWithRecordings(quickLearner);
    setLoading(false); // show UI immediately, even if VideoSDK enrichment is pending

    // Phase 2: try to fetch token + enrich via VideoSDK API in background
    let token = null;
    try {
      token = await getTokenWithTimeout(6000);
    } catch {
      return; // server sleeping or unavailable — DB recordings already shown
    }

    const [mentorEnriched, learnerEnriched] = await Promise.all([
      enrichBookingsWithRecordings(mentorRows, token),
      enrichBookingsWithRecordings(learnerRows, token),
    ]);

    setMentorWithRecordings(mentorEnriched.filter(b => b.recordingUrl));
    setLearnerWithRecordings(learnerEnriched.filter(b => b.recordingUrl));
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      load().catch(err => {
        if (!cancelled) {
          Toast.show('Failed to load recordings');
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    load().catch(() => Toast.show('Failed to refresh')).finally(() => setRefreshing(false));
  }, [load]);

  const openRecording = useCallback(
    rawUrl => {
      const url = normalizeRecordingUrl(rawUrl);
      if (!url) {
        Toast.show('Recording link is unavailable');
        return;
      }
      navigation.navigate(SCREEN_NAMES.RecordingPlayer, { recordingUrl: url });
    },
    [navigation],
  );

  const contextValue = useMemo(
    () => ({
      mentorWithRecordings,
      learnerWithRecordings,
      refreshing,
      onRefresh,
      openRecording,
    }),
    [mentorWithRecordings, learnerWithRecordings, refreshing, onRefresh, openRecording],
  );

  return (
    <SafeScreen scrollable={false} padding={0}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recorded lectures</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.intro}>Switch tabs to see recordings as mentor or as learner.</Text>

        <View style={styles.tabsWrap}>
        <RecordingsContext.Provider value={contextValue}>
          <TopTab.Navigator
            tabBar={props => <CapsuleTabBar {...props} />}
            screenOptions={{
              swipeEnabled: true,
              lazy: true,
            }}
            style={styles.tabNavigator}
            sceneContainerStyle={styles.tabScene}
          >
            <TopTab.Screen
              name={TAB_MENTOR}
              component={MentorRecordingsTab}
              options={{
                tabBarLabel: 'Mentor',
                tabBarIcon: tabIcon('school'),
              }}
            />
            <TopTab.Screen
              name={TAB_LEARNER}
              component={LearnerRecordingsTab}
              options={{
                tabBarLabel: 'Learner',
                tabBarIcon: tabIcon('menu-book'),
              }}
            />
          </TopTab.Navigator>
        </RecordingsContext.Provider>
        </View>
      </View>

      <LoadingOverlay visible={loading && !refreshing} message="Loading recordings…" />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.colors.border.light,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...T.typography.bodyLg,
    color: T.colors.text.primary,
    fontWeight: '700',
  },
  headerSpacer: { width: 40 },
  intro: {
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.xs,
    lineHeight: 20,
  },
  tabsWrap: {
    flex: 1,
    minHeight: 0,
  },
  tabNavigator: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabScene: {
    backgroundColor: 'transparent',
  },
  tabScroll: {
    flex: 1,
  },
  tabScrollContent: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
    paddingBottom: T.spacing.xxxl,
    flexGrow: 1,
  },
  tabHint: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    marginBottom: T.spacing.md,
    lineHeight: 20,
  },
  cards: {
    gap: T.spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.xxl,
    paddingHorizontal: T.spacing.lg,
    backgroundColor: T.colors.component.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    gap: T.spacing.sm,
  },
  emptyText: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    textAlign: 'center',
  },
});
