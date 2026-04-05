import { SafeScreen } from './../../components/SafeScreen';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { earningsApi } from '../../api/earningsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateHelpers';

const T = UNIFIED_THEME;
const PERIODS = ['week', 'month', 'year'];

const chartWidth = Math.min(
  Dimensions.get('window').width - T.spacing.lg * 2 - 8,
  360,
);

export default function MentorEarningsScreen() {
  const { profile } = useAuth();
  const [activePeriod, setActivePeriod] = useState('month');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [periodEarnings, setPeriodEarnings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadEarningsData();
    }
  }, [profile?.id, activePeriod]);

  const loadEarningsData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      const total = await earningsApi.getTotalEarnings(profile.id);
      setTotalEarnings(total?.total || 0);

      let data = [];
      if (activePeriod === 'week') {
        data = await earningsApi.getEarningsByWeek(profile.id);
      } else if (activePeriod === 'month') {
        data = await earningsApi.getEarningsByMonth(profile.id);
      } else {
        data = await earningsApi.getEarningsByYear(profile.id);
      }

      setPeriodEarnings(data || []);

      const chartValues = data?.slice(-7).map(d => parseFloat(d.amount || 0)) || [];
      const chartLabels = data?.slice(-7).map((d, i) => String(i + 1)) || [];

      setChartData({
        labels: chartLabels,
        datasets: [
          {
            data: chartValues.length > 0 ? chartValues : [0],
          },
        ],
      });

      const txns = data?.slice().reverse().slice(0, 10) || [];
      setTransactions(txns);
    } catch (error) {
      Toast.show('Failed to load earnings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionRow}>
      <View style={styles.transactionIcon}>
        <MaterialIcons
          name="trending-up"
          size={20}
          color={T.colors.accent.success}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>
          {item.created_at ? formatDate(item.created_at) : 'Date unknown'}
        </Text>
        <Text style={styles.transactionDetails} numberOfLines={1}>
          Session payout · Booking #{item.booking_id?.slice(0, 8) || '—'}
        </Text>
      </View>
      <Text style={styles.transactionAmount}>
        +{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  const hasChartPoints =
    chartData.datasets?.[0]?.data &&
    chartData.datasets[0].data.some(n => n > 0);

  return (
    <SafeScreen scrollable={true} padding={T.spacing.lg} includeTopInset={false}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.colors.accent.secondary}
          />
        }
      >
        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>Earnings</Text>
          <Text style={styles.pageTitle}>Revenue</Text>
          <Text style={styles.pageSubtitle}>
            Track totals and recent payouts from completed sessions.
          </Text>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Lifetime earnings</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalEarnings)}</Text>
        </View>

        <Text style={styles.periodLabel}>Period</Text>
        <View style={styles.periodSelector}>
          {PERIODS.map(period => {
            const active = activePeriod === period;
            return (
              <TouchableOpacity
                key={period}
                style={[styles.periodButton, active && styles.periodButtonActive]}
                onPress={() => setActivePeriod(period)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.periodText, active && styles.periodTextActive]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasChartPoints ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={200}
              withDots
              withInnerLines={false}
              withOuterLines={false}
              fromZero
              chartConfig={{
                backgroundColor: T.colors.component.card,
                backgroundGradientFrom: T.colors.component.card,
                backgroundGradientTo: T.colors.component.input,
                decimalPlaces: 0,
                color: () => T.colors.accent.secondary,
                labelColor: () => T.colors.text.muted,
                propsForDots: {
                  r: '4',
                  strokeWidth: '1',
                  stroke: T.colors.accent.primary,
                },
              }}
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.noChartContainer}>
            <MaterialIcons
              name="show-chart"
              size={40}
              color={T.colors.text.muted}
            />
            <Text style={styles.noChartText}>No data for this period</Text>
            <Text style={styles.noChartHint}>
              Complete sessions to see trends here.
            </Text>
          </View>
        )}

        <Text style={styles.transactionsHeading}>Recent activity</Text>
        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item, index) => `${item.id || index}`}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        ) : (
          <View style={styles.noTransactionsContainer}>
            <Text style={styles.noTransactionsText}>No transactions yet</Text>
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="Loading earnings..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  pageIntro: {
    marginBottom: T.spacing.lg,
  },
  eyebrow: {
    ...T.typography.labelSm,
    color: T.colors.accent.secondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: T.spacing.xs,
  },
  pageTitle: {
    ...T.typography.headingLg,
    color: T.colors.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.sm,
  },
  pageSubtitle: {
    ...T.typography.bodyMd,
    color: T.colors.text.secondary,
    lineHeight: 22,
  },
  totalCard: {
    backgroundColor: T.colors.component.card,
    marginBottom: T.spacing.lg,
    padding: T.spacing.xl,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    alignItems: 'center',
    ...T.shadows.small,
  },
  totalLabel: {
    ...T.typography.labelMd,
    color: T.colors.text.secondary,
    marginBottom: T.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    ...T.typography.headingLg,
    color: T.colors.accent.success,
    fontWeight: '800',
  },
  periodLabel: {
    ...T.typography.labelMd,
    color: T.colors.text.muted,
    marginBottom: T.spacing.sm,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  periodButton: {
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.sm,
    borderRadius: T.borderRadius.round,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.input,
  },
  periodButtonActive: {
    backgroundColor: T.colors.component.buttonSecondary,
    borderColor: T.colors.border.default,
  },
  periodText: {
    ...T.typography.labelMd,
    color: T.colors.text.secondary,
    fontWeight: '600',
  },
  periodTextActive: {
    color: T.colors.accent.primary,
    fontWeight: '700',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: T.spacing.xl,
  },
  chart: {
    marginVertical: T.spacing.sm,
    borderRadius: T.borderRadius.lg,
    overflow: 'hidden',
  },
  noChartContainer: {
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.spacing.xl,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.xl,
  },
  noChartText: {
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    fontWeight: '600',
    marginTop: T.spacing.md,
  },
  noChartHint: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    marginTop: T.spacing.xs,
    textAlign: 'center',
  },
  transactionsHeading: {
    ...T.typography.headingSm,
    fontSize: 17,
    color: T.colors.text.primary,
    fontWeight: '700',
    marginBottom: T.spacing.md,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.colors.border.light,
    gap: T.spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.component.input,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionDate: {
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDetails: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
  },
  transactionAmount: {
    ...T.typography.labelMd,
    color: T.colors.accent.success,
    fontWeight: '700',
  },
  noTransactionsContainer: {
    alignItems: 'center',
    paddingVertical: T.spacing.xl,
  },
  noTransactionsText: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
  },
});
