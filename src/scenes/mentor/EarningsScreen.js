import { SafeScreen } from './../../components/SafeScreen';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { earningsApi } from '../../api/earningsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateHelpers';

const PERIODS = ['week', 'month', 'year'];

export default function MentorEarningsScreen({ navigation }) {
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

      // Load total earnings
      const total = await earningsApi.getTotalEarnings(profile.id);
      setTotalEarnings(total?.total || 0);

      // Load period-specific earnings
      let data = [];
      if (activePeriod === 'week') {
        data = await earningsApi.getEarningsByWeek(profile.id);
      } else if (activePeriod === 'month') {
        data = await earningsApi.getEarningsByMonth(profile.id);
      } else {
        data = await earningsApi.getEarningsByYear(profile.id);
      }

      setPeriodEarnings(data || []);

      // Prepare chart data (last 7/30 entries)
      const chartValues = data?.slice(-7).map(d => parseFloat(d.amount || 0)) || [];
      const chartLabels = data?.slice(-7).map((d, i) => String(i)) || [];

      setChartData({
        labels: chartLabels,
        datasets: [
          {
            data: chartValues.length > 0 ? chartValues : [0],
          },
        ],
      });

      // Prepare transactions (most recent earnings)
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
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>
          {item.created_at ? formatDate(item.created_at) : 'Date unknown'}
        </Text>
        <Text style={styles.transactionDetails}>
          Session with learner • Booking #{item.booking_id?.slice(0, 8)}
        </Text>
      </View>
      <Text style={styles.transactionAmount}>+{formatCurrency(item.amount)}</Text>
    </View>
  );

  return (
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={UNIFIED_THEME.colors.primary.light}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
        </View>

        {/* Total Earnings */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalEarnings)}</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                activePeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setActivePeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  activePeriod === period && styles.periodTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        {chartData.datasets?.[0]?.data && chartData.datasets[0].data.length > 0 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={400}
              height={220}
              chartConfig={{
                backgroundColor: UNIFIED_THEME.colors.component.input,
                backgroundGradientFrom: UNIFIED_THEME.colors.component.input,
                backgroundGradientTo: UNIFIED_THEME.colors.component.input,
                color: () => UNIFIED_THEME.colors.primary.light,
                strokeWidth: 2,
                useShadowColorFromDataset: false,
              }}
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.noChartContainer}>
            <Text style={styles.noChartText}>No earnings data available</Text>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>

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
              <Text style={styles.noTransactionsText}>
                No transactions yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Loading earnings..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },
  title: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
  },
  totalSection: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    padding: UNIFIED_THEME.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.primary.light,
    alignItems: 'center',
  },
  totalLabel: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  totalAmount: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.success,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  periodButton: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },
  periodButtonActive: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  periodText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
  },
  periodTextActive: {
    color: UNIFIED_THEME.colors.primary.light,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  chart: {
    marginVertical: UNIFIED_THEME.spacing.md,
    borderRadius: 12,
  },
  noChartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  noChartText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  transactionsSection: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  transactionsTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.primary.light,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDetails: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  transactionAmount: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.success,
    fontWeight: '600',
  },
  noTransactionsContainer: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xl,
  },
  noTransactionsText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
});
