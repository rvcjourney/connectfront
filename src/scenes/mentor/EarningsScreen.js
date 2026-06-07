import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { SafeScreen } from '../../components/SafeScreen';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { useAuth } from '../../hooks/useAuth';
import { earningsApi } from '../../api/earningsApi';
import { paymentApi } from '../../api/paymentApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateHelpers';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const TEAL = C.accent.secondary;
const GOLD = C.accent.primary;
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
                    colors={B.nebulaGradient}
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

export default function MentorEarningsScreen() {
  const { profile } = useAuth();
  const [activePeriod, setActivePeriod] = useState('month');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [periodEarnings, setPeriodEarnings] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [allEarnings, setAllEarnings] = useState([]);
  const [shownCount, setShownCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (profile?.id) loadEarningsData();
  }, [profile?.id, activePeriod]);

  const loadEarningsData = async () => {
    if (!profile?.id) return;
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setPeriodLoading(true);
      }

      const periodFetch =
        activePeriod === 'week' ? earningsApi.getEarningsByWeek(profile.id)
        : activePeriod === 'month' ? earningsApi.getEarningsByMonth(profile.id)
        : earningsApi.getEarningsByYear(profile.id);

      const [wallet, data, all] = await Promise.all([
        paymentApi.getWallet(profile.id),
        periodFetch,
        earningsApi.getEarningsByMentor(profile.id),
      ]);

      hasLoadedRef.current = true;
      setTotalEarnings(wallet?.total_earned || 0);
      setPeriodEarnings(data || []);
      setTotalPayouts((all || []).length);
      setAllEarnings(all || []);
      setShownCount(6);

      // Build full period grid (fill missing slots with 0)
      let labels = [];
      let values = [];

      if (activePeriod === 'week') {
        const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        labels = [...DAY_LABELS];
        const earningsByDate = {};
        (data || []).forEach(d => {
          if (d.date) {
            const [y, m, day] = d.date.split('-').map(Number);
            const dayIdx = new Date(y, m - 1, day).getDay();
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

      const hasData = values.some(v => v > 0);
      setChartData(hasData ? { labels, datasets: [{ data: values }] } : null);
    } catch {
      Toast.show('Failed to load earnings');
    } finally {
      setLoading(false);
      setPeriodLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadEarningsData(); setRefreshing(false); };

  const bestPoint = periodEarnings.reduce((max, r) => Math.max(max, parseFloat(r?.amount || 0)), 0);

  return (
    <SafeScreen hasBottomTabs={false} padding={T.spacing.lg} includeTopInset={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TEAL} />}
      >
        <View style={styles.totalHighlight}>
          <Text style={styles.totalLabel}>Total earnings</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalEarnings)}</Text>
          <Text style={styles.totalNote}>All completed sessions</Text>
        </View>

        <View style={styles.statsBar}>
          <StatSegment
            icon="receipt-long"
            iconColor={PURPLE_LINK}
            value={String(totalPayouts)}
            label="Payouts"
          />
          <View style={styles.statDivider} />
          <StatSegment
            icon="star"
            iconColor={GOLD}
            value={formatCurrency(bestPoint)}
            label="Peak"
          />
          <View style={styles.statDivider} />
          <StatSegment
            icon="trending-up"
            iconColor={TEAL}
            value={String(allEarnings.length)}
            label="Entries"
          />
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
          {periodLoading ? (
            <View style={styles.emptyChart}>
              <ActivityIndicator color={TEAL} />
            </View>
          ) : chartData ? (
            <CustomBarChart data={chartData} />
          ) : (
            <View style={styles.emptyChart}>
              <MaterialIcons name="bar-chart" size={36} color={PURPLE_LINK} />
              <Text style={styles.emptyTxt}>No data for this period</Text>
              <Text style={styles.emptyHint}>Complete sessions to see trends</Text>
            </View>
          )}
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.secHdrRow}>
          <Text style={styles.secHdrTitle}>Recent Activity</Text>
          {allEarnings.length > 0 ? (
            <View style={styles.secHdrCount}>
              <Text style={styles.secHdrCountText}>{allEarnings.length}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.txnCard}>
          {allEarnings.length > 0 ? (
            allEarnings.slice(0, shownCount).map((item, index) => {
              const visibleCount = Math.min(shownCount, allEarnings.length);
              const isLast = index === visibleCount - 1 && shownCount >= allEarnings.length;
              return (
                <View
                  key={item.id || index}
                  style={[styles.txnRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.txnIcon}>
                    <MaterialIcons name="trending-up" size={18} color={TEAL} />
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
              );
            })
          ) : (
            <View style={styles.emptyTxn}>
              <MaterialIcons name="receipt-long" size={28} color={PURPLE_LINK} />
              <Text style={styles.emptyTxt}>No transactions yet</Text>
            </View>
          )}
        </View>
        {shownCount < allEarnings.length && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={() => setShownCount(prev => prev + 6)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="expand-more" size={20} color={PURPLE_LINK} />
            <Text style={styles.loadMoreTxt}>Load more</Text>
          </TouchableOpacity>
        )}
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
    color: PURPLE_LINK,
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
    color: C.text.muted,
    marginTop: 6,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  totalHighlight: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: S.accentSuccess,
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE_LINK,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: T.spacing.xs,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: C.accent.success,
    letterSpacing: -0.5,
  },
  totalNote: {
    fontSize: 12,
    color: C.text.muted,
    marginTop: 4,
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
    fontSize: 15,
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
  periodRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    padding: 3,
    marginBottom: T.spacing.lg,
  },
  periodTab: {
    flex: 1,
    paddingVertical: T.spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  periodTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text.muted,
  },
  periodTxtActive: {
    color: PURPLE_LINK,
    fontWeight: '800',
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.lg,
    overflow: 'hidden',
    ...Platform.select({ ios: T.shadows.small, android: { elevation: 3 } }),
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  emptyTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text.primary,
  },
  emptyHint: {
    fontSize: 12,
    color: C.text.muted,
  },
  secHdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: T.spacing.xs,
    marginBottom: T.spacing.sm,
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
  txnCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    marginBottom: T.spacing.lg,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.spacing.md + 2,
    paddingHorizontal: T.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: T.spacing.md,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: S.accentTeal,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnInfo: { flex: 1, gap: 3 },
  txnDate: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text.primary,
  },
  txnSub: {
    fontSize: 12,
    color: C.text.secondary,
    fontWeight: '500',
  },
  txnAmt: {
    fontSize: 15,
    color: C.accent.success,
    fontWeight: '800',
  },
  emptyTxn: {
    alignItems: 'center',
    paddingVertical: T.spacing.xl,
    gap: T.spacing.sm,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    marginTop: -T.spacing.sm,
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
});
