import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { useAuth } from '../../hooks/useAuth';
import { earningsApi } from '../../api/earningsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateHelpers';

const T = UNIFIED_THEME;
const PERIODS = ['week', 'month', 'year'];
const CHART_HEIGHT = 160;
const screenWidth = Dimensions.get('window').width;

// ─── Custom Bar Chart ──────────────────────────────────────────────────────────
function CustomBarChart({ data }) {
  if (!data || !data.labels || data.labels.length === 0) return null;

  const values = data.datasets[0].data;
  const maxVal = Math.max(...values, 1);
  const barCount = values.length;
  const barWidth = Math.min(36, (screenWidth - T.spacing.lg * 4) / barCount - 8);

  return (
    <View style={chart.container}>
      {/* Y-axis hint lines */}
      {[1, 0.5].map((frac) => (
        <View
          key={frac}
          style={[chart.gridLine, { bottom: CHART_HEIGHT * frac + 24 }]}
        />
      ))}

      {/* Bars */}
      <View style={chart.barsRow}>
        {values.map((val, i) => {
          const pct = val / maxVal;
          const barH = Math.max(pct * CHART_HEIGHT, val > 0 ? 6 : 2);
          const isZero = val === 0;

          return (
            <View key={i} style={chart.barGroup}>
              {/* Value label on top */}
              {val > 0 && (
                <Text style={chart.valueLabel}>
                  ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </Text>
              )}

              {/* Bar */}
              <View style={[chart.barTrack, { height: CHART_HEIGHT, width: barWidth }]}>
                {isZero ? (
                  <View style={[chart.barEmpty, { width: barWidth }]} />
                ) : (
                  <LinearGradient
                    colors={['#5eead4', '#a78bfa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[chart.bar, { height: barH, width: barWidth }]}
                  />
                )}
              </View>

              {/* X-axis label */}
              <Text style={chart.xLabel}>{data.labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function MentorEarningsScreen() {
  const { profile } = useAuth();
  const [activePeriod, setActivePeriod] = useState('month');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [periodEarnings, setPeriodEarnings] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [recentEarnings, setRecentEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) loadEarningsData();
  }, [profile?.id, activePeriod]);

  const loadEarningsData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      const periodFetch =
        activePeriod === 'week' ? earningsApi.getEarningsByWeek(profile.id)
        : activePeriod === 'month' ? earningsApi.getEarningsByMonth(profile.id)
        : earningsApi.getEarningsByYear(profile.id);

      const [total, data, all] = await Promise.all([
        earningsApi.getTotalEarnings(profile.id),
        periodFetch,
        earningsApi.getEarningsByMentor(profile.id),
      ]);

      setTotalEarnings(total || 0);
      setPeriodEarnings(data || []);
      setRecentEarnings((all || []).slice(0, 10));

      // Build full period grid (fill missing slots with 0)
      let labels = [];
      let values = [];

      if (activePeriod === 'week') {
        const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        const today = new Date();
        const dayOfWeek = today.getDay();
        labels = DAY_LABELS.map((lbl, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - dayOfWeek + i);
          return lbl;
        });
        const earningsByDate = {};
        (data || []).forEach(d => {
          if (d.date) {
            const dayIdx = new Date(d.date).getDay();
            earningsByDate[DAY_LABELS[dayIdx]] = parseFloat(d.amount || 0);
          }
        });
        values = labels.map(lbl => earningsByDate[lbl] || 0);

      } else if (activePeriod === 'month') {
        labels = ['W1','W2','W3','W4'];
        const earningsByWeek = {};
        (data || []).forEach(d => {
          if (d.week) earningsByWeek[d.week.replace('Week ', 'W')] = parseFloat(d.amount || 0);
        });
        values = labels.map(lbl => earningsByWeek[lbl] || 0);

      } else {
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        labels = MONTHS;
        const earningsByMonth = {};
        (data || []).forEach(d => {
          if (d.month) earningsByMonth[d.month.slice(0, 3)] = parseFloat(d.amount || 0);
        });
        values = MONTHS.map(m => earningsByMonth[m] || 0);
      }

      setChartData({ labels, datasets: [{ data: values }] });
    } catch {
      Toast.show('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadEarningsData(); setRefreshing(false); };

  const bestPoint = periodEarnings.reduce((max, r) => Math.max(max, parseFloat(r?.amount || 0)), 0);

  return (
    <SafeScreen hasBottomTabs={false} padding={T.spacing.lg} includeTopInset={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.colors.accent.secondary} />}
      >
        {/* ── Total + KPI row ── */}
        <View style={styles.topRow}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalEarnings)}</Text>
            <Text style={styles.totalNote}>All completed sessions</Text>
          </View>
          <View style={styles.kpiCol}>
            <View style={styles.kpiCard}>
              <MaterialIcons name="receipt-long" size={16} color={T.colors.accent.secondary} />
              <Text style={styles.kpiVal}>{recentEarnings.length}</Text>
              <Text style={styles.kpiLbl}>Payouts</Text>
            </View>
            <View style={styles.kpiCard}>
              <MaterialIcons name="star" size={16} color={T.colors.accent.primary} />
              <Text style={styles.kpiVal}>{formatCurrency(bestPoint)}</Text>
              <Text style={styles.kpiLbl}>Peak</Text>
            </View>
          </View>
        </View>

        {/* ── Period Selector ── */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, activePeriod === p && styles.periodTabActive]}
              onPress={() => setActivePeriod(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodTxt, activePeriod === p && styles.periodTxtActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Chart Card ── */}
        <View style={styles.chartCard}>
          {chartData ? (
            <CustomBarChart data={chartData} />
          ) : (
            <View style={styles.emptyChart}>
              <MaterialIcons name="bar-chart" size={36} color={T.colors.text.muted} />
              <Text style={styles.emptyTxt}>No data for this period</Text>
              <Text style={styles.emptyHint}>Complete sessions to see trends</Text>
            </View>
          )}
        </View>

        {/* ── Recent Activity ── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.txnCard}>
          {recentEarnings.length > 0 ? (
            recentEarnings.map((item, index) => (
              <View
                key={item.id || index}
                style={[styles.txnRow, index === recentEarnings.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.txnIcon}>
                  <MaterialIcons name="trending-up" size={18} color={T.colors.accent.success} />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnDate}>{item.created_at ? formatDate(item.created_at) : '—'}</Text>
                  <Text style={styles.txnSub} numberOfLines={1}>
                    {item.source === 'video_subscription'
                      ? 'Video subscription'
                      : item.bookings?.profiles?.name || `Session #${item.booking_id?.slice(0, 8) || '—'}`}
                  </Text>
                </View>
                <Text style={styles.txnAmt}>+{formatCurrency(item.amount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyTxn}>
              <MaterialIcons name="receipt-long" size={28} color={T.colors.text.muted} />
              <Text style={styles.emptyTxt}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Loading earnings..." />
    </SafeScreen>
  );
}

// ─── Custom chart styles ───────────────────────────────────────────────────────
const chart = StyleSheet.create({
  container: {
    paddingTop: T.spacing.xl,
    paddingBottom: T.spacing.sm,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: CHART_HEIGHT + 40,
  },
  barGroup: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: T.colors.accent.secondary,
    marginBottom: 4,
  },
  barTrack: {
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
  },
  barEmpty: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  xLabel: {
    fontSize: 11,
    color: T.colors.text.muted,
    marginTop: 6,
    fontWeight: '600',
  },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: T.spacing.sm, marginBottom: T.spacing.lg },
  totalCard: {
    flex: 1,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.lg,
    justifyContent: 'center',
  },
  totalLabel: { fontSize: 11, fontWeight: '700', color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: T.spacing.xs },
  totalAmount: { fontSize: 26, fontWeight: '800', color: T.colors.accent.success, letterSpacing: -0.3 },
  totalNote: { fontSize: 12, color: T.colors.text.muted, marginTop: 2 },

  kpiCol: { gap: T.spacing.sm },
  kpiCard: {
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    paddingVertical: T.spacing.sm,
    paddingHorizontal: T.spacing.md,
    alignItems: 'center',
    gap: 2,
    minWidth: 90,
  },
  kpiVal: { fontSize: 13, fontWeight: '800', color: T.colors.text.primary },
  kpiLbl: { fontSize: 11, color: T.colors.text.muted },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.round,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: 3,
    marginBottom: T.spacing.lg,
  },
  periodTab: { flex: 1, paddingVertical: T.spacing.sm, borderRadius: T.borderRadius.round, alignItems: 'center' },
  periodTabActive: { backgroundColor: T.colors.component.buttonSecondary },
  periodTxt: { fontSize: 13, fontWeight: '600', color: T.colors.text.muted },
  periodTxtActive: { color: T.colors.accent.primary, fontWeight: '700' },

  chartCard: {
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.lg,
    overflow: 'hidden',
  },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center', gap: T.spacing.sm },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: T.colors.text.primary },
  emptyHint: { fontSize: 12, color: T.colors.text.muted },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: T.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: T.spacing.sm },
  txnCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.default,
    overflow: 'hidden',
    marginBottom: T.spacing.lg,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.spacing.md + 2,
    paddingHorizontal: T.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.colors.border.light,
    gap: T.spacing.md,
  },
  txnIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  txnInfo: { flex: 1, gap: 3 },
  txnDate: { fontSize: 14, fontWeight: '700', color: T.colors.text.primary },
  txnSub: { fontSize: 12, color: T.colors.text.secondary, fontWeight: '500' },
  txnAmt: { fontSize: 15, color: T.colors.accent.success, fontWeight: '800' },
  emptyTxn: { alignItems: 'center', paddingVertical: T.spacing.xl, gap: T.spacing.sm },
});
