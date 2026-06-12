import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { useFocusEffect } from '@react-navigation/native';
import { SafeScreen } from '../../components/SafeScreen';
import { CosmicTopTabBar } from '../../components/CapsuleTabBar';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { bookingApi } from '../../api/bookingApi';
import { videoApi } from '../../api/videoApi';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;
const PANEL_BG = '#161432';
const INPUT_BG = '#0f0e2a';
const TopTab = createMaterialTopTabNavigator();

const TAB_MENTOR = 'TransactionHistory_MentorTab';
const TAB_LEARNER = 'TransactionHistory_LearnerTab';

const TransactionContext = createContext(null);

function useTransactionContext() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactionContext must be used within TransactionHistoryScreen');
  return ctx;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${ampm}`;
}

const STATUS_CONFIG = {
  completed:  { label: 'Completed',  color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  confirmed:  { label: 'Confirmed',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  pending:    { label: 'Pending',    color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  cancelled:  { label: 'Cancelled',  color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
};

function statusConfig(status) {
  return STATUS_CONFIG[status] || { label: status, color: C.text.muted, bg: S.accentViolet };
}

// ─── Subscription Card ───────────────────────────────────────────────────────

function SubscriptionCard({ sub }) {
  const mentor = sub.profiles;
  const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();

  return (
    <View style={[styles.card, subStyles.videoCard]}>
      <View style={styles.cardAvatar}>
        {mentor?.avatar_url ? (
          <Image source={{ uri: mentor.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarFallback, subStyles.videoFallback]}>
            <MaterialIcons name="videocam" size={22} color={T.colors.accent.secondary} />
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        <View style={subStyles.nameRow}>
          <Text style={[styles.personName, { flex: 1 }]} numberOfLines={1}>
            {mentor?.name || 'Mentor'}
          </Text>
          <View style={subStyles.videoTag}>
            <Text style={subStyles.videoTagText}>VIDEO</Text>
          </View>
        </View>
        <Text style={styles.slotDate}>
          {sub.unlocked_at ? formatDate(sub.unlocked_at) : '—'}  ·  Video library
        </Text>
        <View style={[styles.statusBadge, {
          backgroundColor: isExpired ? 'rgba(248,113,113,0.12)' : 'rgba(94,234,212,0.1)',
        }]}>
          <Text style={[styles.statusText, { color: isExpired ? '#F87171' : '#5eead4' }]}>
            {isExpired
              ? 'Expired'
              : sub.expires_at
                ? `Expires ${formatDate(sub.expires_at)}`
                : 'Active'}
          </Text>
        </View>
      </View>

      <View style={styles.cardAmount}>
        <Text style={[styles.amountText, { color: T.colors.accent.primary }]}>
          −₹{sub.amount_paid ?? '—'}
        </Text>
        <Text style={styles.amountSub}>Subscribed</Text>
      </View>
    </View>
  );
}

// ─── Transaction Card ────────────────────────────────────────────────────────

function TransactionCard({ booking, isMentor }) {
  const person = booking?.profiles;
  const slot   = booking?.availability_slots;
  const price  = booking?.mentor_profiles?.price_per_hour ?? null;
  const status = booking?.status || 'pending';
  const cfg    = statusConfig(status);

  const amountLabel = () => {
    if (price === null) return '—';
    if (status === 'cancelled') return '₹0';
    return `₹${price}`;
  };

  const amountColor = () => {
    if (status === 'cancelled') return T.colors.text.muted;
    if (isMentor) return '#34D399';   // green — earned
    return T.colors.accent.primary;   // accent — paid
  };

  const amountPrefix = () => {
    if (status === 'cancelled') return '';
    return isMentor ? '+' : '−';
  };

  return (
    <View style={styles.card}>
      {/* Left: avatar */}
      <View style={styles.cardAvatar}>
        {person?.avatar_url ? (
          <Image source={{ uri: person.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <MaterialIcons name="person" size={22} color={T.colors.text.muted} />
          </View>
        )}
      </View>

      {/* Middle: info */}
      <View style={styles.cardInfo}>
        <View style={subStyles.nameRow}>
          <Text style={[styles.personName, { flex: 1 }]} numberOfLines={1}>
            {person?.name || 'Unknown'}
          </Text>
          <View style={subStyles.sessionTag}>
            <Text style={subStyles.sessionTagText}>SESSION</Text>
          </View>
        </View>
        <Text style={styles.slotDate}>
          {slot?.date ? formatDate(slot.date) : formatDate(booking?.created_at)}
          {slot?.start_time ? `  ·  ${formatTime(slot.start_time)}` : ''}
        </Text>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Right: amount */}
      <View style={styles.cardAmount}>
        <Text style={[styles.amountText, { color: amountColor() }]}>
          {amountPrefix()}{amountLabel()}
        </Text>
        <Text style={styles.amountSub}>{isMentor ? 'Earned' : 'Paid'}</Text>
      </View>
    </View>
  );
}

// ─── Tab Screens ─────────────────────────────────────────────────────────────

function MentorTransactionsTab() {
  const { mentorTx, refreshing, onRefresh } = useTransactionContext();

  const total = useMemo(() => {
    return mentorTx
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b?.mentor_profiles?.price_per_hour || 0), 0);
  }, [mentorTx]);

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.colors.accent.primary} />
      }
    >
      {/* Summary strip */}
      {total > 0 && (
        <View style={styles.summaryStrip}>
          <MaterialIcons name="account-balance-wallet" size={18} color="#34D399" />
          <Text style={styles.summaryText}>
            Total earned from completed sessions:{' '}
            <Text style={styles.summaryAmount}>₹{total}</Text>
          </Text>
        </View>
      )}

      <Text style={styles.tabHint}>All sessions you hosted as a mentor.</Text>

      {mentorTx.length > 0 ? (
        <View style={styles.list}>
          {mentorTx.map(item => (
            <TransactionCard key={item.id} booking={item} isMentor />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <MaterialIcons name="school" size={28} color={PURPLE_LINK} />
          <Text style={styles.emptyText}>No mentor transactions yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

function LearnerTransactionsTab() {
  const { learnerTx, videoSubs, refreshing, onRefresh } = useTransactionContext();

  const combined = useMemo(() => {
    const sessions = learnerTx.map(b => ({ ...b, _type: 'session' }));
    const subs = videoSubs.map(s => ({ ...s, _type: 'subscription' }));
    return [...sessions, ...subs].sort((a, b) => {
      const dateA = new Date(a._type === 'session' ? (a.availability_slots?.date || a.created_at) : (a.unlocked_at || 0));
      const dateB = new Date(b._type === 'session' ? (b.availability_slots?.date || b.created_at) : (b.unlocked_at || 0));
      return dateB - dateA;
    });
  }, [learnerTx, videoSubs]);

  const total = useMemo(() => {
    const sessionTotal = learnerTx
      .filter(b => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + (b?.mentor_profiles?.price_per_hour || 0), 0);
    const subsTotal = videoSubs.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
    return sessionTotal + subsTotal;
  }, [learnerTx, videoSubs]);

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.colors.accent.primary} />
      }
    >
      {total > 0 && (
        <View style={[styles.summaryStrip, { borderLeftColor: T.colors.accent.primary }]}>
          <MaterialIcons name="payments" size={18} color={T.colors.accent.primary} />
          <Text style={styles.summaryText}>
            Total spent:{' '}
            <Text style={[styles.summaryAmount, { color: T.colors.accent.primary }]}>₹{total}</Text>
          </Text>
        </View>
      )}

      <Text style={styles.tabHint}>All sessions and subscriptions as a learner.</Text>

      {combined.length > 0 ? (
        <View style={styles.list}>
          {combined.map(item =>
            item._type === 'subscription'
              ? <SubscriptionCard key={`sub_${item.id}`} sub={item} />
              : <TransactionCard key={item.id} booking={item} isMentor={false} />
          )}
        </View>
      ) : (
        <View style={styles.empty}>
          <MaterialIcons name="menu-book" size={28} color={PURPLE_LINK} />
          <Text style={styles.emptyText}>No learner transactions yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Tab icon helper ──────────────────────────────────────────────────────────

const tabIcon = name => ({ color, focused }) => (
  <MaterialIcons name={name} size={focused ? 22 : 20} color={color} />
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TransactionHistoryScreen({ navigation }) {
  const { profile } = useAuth();
  const [mentorTx, setMentorTx]   = useState([]);
  const [learnerTx, setLearnerTx] = useState([]);
  const [videoSubs, setVideoSubs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const [mentorRes, learnerRes, subsRes] = await Promise.allSettled([
      bookingApi.getTransactionsAsMentor(profile.id),
      bookingApi.getTransactionsAsLearner(profile.id),
      videoApi.getLearnerSubscriptions(profile.id),
    ]);

    if (mentorRes.status === 'fulfilled') setMentorTx(mentorRes.value);
    else console.error('[TransactionHistory] mentor fetch failed:', mentorRes.reason?.message);

    if (learnerRes.status === 'fulfilled') setLearnerTx(learnerRes.value);
    else console.error('[TransactionHistory] learner fetch failed:', learnerRes.reason?.message);

    if (subsRes.status === 'fulfilled') setVideoSubs(subsRes.value);
    else console.error('[TransactionHistory] subs fetch failed:', subsRes.reason?.message);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (err) {
          if (!cancelled) {
            console.error(err);
            Toast.show('Failed to load transactions');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      Toast.show('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const contextValue = useMemo(
    () => ({ mentorTx, learnerTx, videoSubs, refreshing, onRefresh }),
    [mentorTx, learnerTx, videoSubs, refreshing, onRefresh],
  );

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction history</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.intro}>Switch tabs to view your mentor earnings and learner payments.</Text>

        <View style={styles.tabsWrap}>
          <TransactionContext.Provider value={contextValue}>
            <TopTab.Navigator
              tabBar={props => <CosmicTopTabBar {...props} />}
              screenOptions={{ swipeEnabled: true, lazy: true }}
              style={styles.tabNavigator}
              sceneContainerStyle={styles.tabScene}
            >
              <TopTab.Screen
                name={TAB_MENTOR}
                component={MentorTransactionsTab}
                options={{ tabBarLabel: 'Mentor', tabBarIcon: tabIcon('school') }}
              />
              <TopTab.Screen
                name={TAB_LEARNER}
                component={LearnerTransactionsTab}
                options={{ tabBarLabel: 'Learner', tabBarIcon: tabIcon('menu-book') }}
              />
            </TopTab.Navigator>
          </TransactionContext.Provider>
        </View>
      </View>

      <LoadingOverlay visible={loading && !refreshing} message="Loading transactions…" />
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167,139,250,0.22)',
    backgroundColor: INPUT_BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: T.borderRadius.md,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    color: C.text.primary,
    fontWeight: '800',
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

  tabsWrap: { flex: 1, minHeight: 0 },
  tabNavigator: { flex: 1, backgroundColor: 'transparent' },
  tabScene: { backgroundColor: 'transparent' },

  tabScroll: { flex: 1 },
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

  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    backgroundColor: PANEL_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    marginBottom: T.spacing.md,
  },
  summaryText: {
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  summaryAmount: {
    fontWeight: '700',
    color: '#34D399',
  },

  list: { gap: T.spacing.sm },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.md,
    gap: T.spacing.md,
  },

  cardAvatar: {},
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardInfo: { flex: 1, gap: 3 },
  personName: {
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    fontWeight: '600',
  },
  slotDate: {
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  cardAmount: { alignItems: 'flex-end', gap: 2 },
  amountText: {
    ...T.typography.bodyMd,
    fontWeight: '700',
    fontSize: 16,
  },
  amountSub: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    fontSize: 11,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.xxl,
    paddingHorizontal: T.spacing.lg,
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    gap: T.spacing.sm,
  },
  emptyText: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    textAlign: 'center',
  },
});

const subStyles = StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionTag: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionTagText: { color: '#60A5FA', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  videoTag: {
    backgroundColor: 'rgba(94,234,212,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoTagText: { color: '#5eead4', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  videoCard: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(94,234,212,0.35)',
  },
  videoFallback: {
    backgroundColor: 'rgba(94,234,212,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.2)',
  },
});
