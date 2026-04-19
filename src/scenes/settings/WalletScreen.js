import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import { useFocusEffect } from '@react-navigation/native';
import { SafeScreen } from '../../components/SafeScreen';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { paymentApi } from '../../api/paymentApi';
import { useAuth } from '../../hooks/useAuth';

const T = UNIFIED_THEME;
const MIN_WITHDRAWAL = 5000;

const fmt = (n) =>
  `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function InfoRow({ icon, label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <MaterialIcons name={icon} size={18} color={T.colors.text.muted} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export default function WalletScreen({ navigation }) {
  const { profile } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [pendingAmount, setPendingAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      loadData();
    }, [profile?.id]),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [w, pending] = await Promise.all([
        paymentApi.getWallet(profile.id),
        paymentApi.getPendingEarnings(profile.id),
      ]);
      setWallet(w);
      setPendingAmount(pending);
    } catch {
      Toast.show('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!upiId.trim()) { Toast.show('Enter UPI ID'); return; }
    if (!amount || isNaN(amount) || amount <= 0) { Toast.show('Enter a valid amount'); return; }
    if (amount > wallet.balance) { Toast.show('Amount exceeds available balance'); return; }
    if (amount < MIN_WITHDRAWAL) { Toast.show(`Minimum withdrawal is ₹${MIN_WITHDRAWAL.toLocaleString('en-IN')}`); return; }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${fmt(amount)} to\n${upiId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSubmitting(true);
              await paymentApi.requestWithdrawal({ mentorId: profile.id, amount, upiId: upiId.trim() });
              Toast.show('Withdrawal request submitted');
              setShowWithdraw(false);
              setUpiId('');
              setWithdrawAmount('');
              await loadData();
            } catch {
              Toast.show('Failed to submit withdrawal');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const canWithdraw = wallet.balance >= MIN_WITHDRAWAL;
  const progressPct = Math.min((wallet.balance / MIN_WITHDRAWAL) * 100, 100);

  return (
    <SafeScreen hasBottomTabs={false} includeTopInset={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.colors.accent.secondary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Balance Hero Card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(94,234,212,0.18)', 'rgba(124,58,237,0.22)', 'rgba(2,0,20,0.9)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTop}>
            <View style={styles.walletIconWrap}>
              <LinearGradient
                colors={['rgba(94,234,212,0.3)', 'rgba(167,139,250,0.2)']}
                style={styles.walletIconGrad}
              >
                <MaterialIcons name="account-balance-wallet" size={26} color={T.colors.accent.secondary} />
              </LinearGradient>
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroLabel}>Available Balance</Text>
              <Text style={styles.heroAmount}>{fmt(wallet.balance)}</Text>
              <Text style={styles.heroNote}>Earned from completed sessions</Text>
            </View>
          </View>

          {pendingAmount > 0 && (
            <View style={styles.pendingRow}>
              <MaterialIcons name="hourglass-top" size={14} color={T.colors.accent.warning} />
              <Text style={styles.pendingText}>
                {fmt(pendingAmount)} pending · unlocks after session completion
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <LinearGradient
              colors={['rgba(52,211,153,0.12)', 'rgba(52,211,153,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <MaterialIcons name="trending-up" size={22} color={T.colors.accent.success} />
            <Text style={[styles.statVal, { color: T.colors.accent.success }]}>{fmt(wallet.total_earned)}</Text>
            <Text style={styles.statLbl}>Total Earned</Text>
          </View>

          <View style={styles.statBox}>
            <LinearGradient
              colors={['rgba(240,216,117,0.12)', 'rgba(240,216,117,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <MaterialIcons name="hourglass-top" size={22} color={T.colors.accent.warning} />
            <Text style={[styles.statVal, { color: T.colors.accent.warning }]}>{fmt(pendingAmount)}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>

          <View style={styles.statBox}>
            <LinearGradient
              colors={['rgba(167,139,250,0.12)', 'rgba(167,139,250,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <MaterialIcons name="arrow-circle-up" size={22} color={T.colors.component.button} />
            <Text style={[styles.statVal, { color: T.colors.component.button }]}>{fmt(wallet.total_withdrawn)}</Text>
            <Text style={styles.statLbl}>Withdrawn</Text>
          </View>
        </View>

        {/* Withdraw progress / button */}
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawCardHeader}>
            <Text style={styles.withdrawCardTitle}>Withdraw Earnings</Text>
            {canWithdraw && (
              <View style={styles.readyBadge}>
                <MaterialIcons name="check-circle" size={13} color={T.colors.accent.success} />
                <Text style={styles.readyText}>Ready</Text>
              </View>
            )}
          </View>

          {!canWithdraw && (
            <>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[T.colors.accent.secondary, T.colors.accent.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <Text style={styles.progressNote}>
                {fmt(wallet.balance)} of ₹{MIN_WITHDRAWAL.toLocaleString('en-IN')} minimum
                {wallet.balance > 0
                  ? ` · ₹${(MIN_WITHDRAWAL - wallet.balance).toLocaleString('en-IN')} more needed`
                  : ''}
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.withdrawBtn, !canWithdraw && styles.withdrawBtnOff]}
            onPress={() => setShowWithdraw(v => !v)}
            disabled={!canWithdraw}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canWithdraw
                ? [T.colors.accent.secondary, T.colors.component.button]
                : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.withdrawBtnGrad}
            >
              <MaterialIcons
                name="account-balance"
                size={18}
                color={canWithdraw ? T.colors.text.onAccent : T.colors.text.muted}
              />
              <Text style={[styles.withdrawBtnTxt, !canWithdraw && { color: T.colors.text.muted }]}>
                {showWithdraw ? 'Cancel' : 'Request Withdrawal'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Withdrawal Form */}
        {showWithdraw && (
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Withdrawal Details</Text>

            <Text style={styles.fieldLabel}>UPI ID</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="phone-android" size={18} color={T.colors.text.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.fieldInput}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="yourname@upi"
                placeholderTextColor={T.colors.text.muted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.fieldInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder={`Min ₹${MIN_WITHDRAWAL.toLocaleString('en-IN')}`}
                placeholderTextColor={T.colors.text.muted}
                keyboardType="numeric"
              />
            </View>

            <InfoRow icon="info-outline" label="Processing time" value="1–2 business days" />
            <InfoRow
              icon="account-balance-wallet"
              label="Max withdrawable"
              value={fmt(wallet.balance)}
              valueColor={T.colors.accent.success}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, submitting && { opacity: 0.5 }]}
              onPress={handleWithdraw}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[T.colors.accent.success, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtnGrad}
              >
                <Text style={styles.confirmBtnTxt}>
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="Loading wallet..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: T.spacing.lg, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.colors.component.card,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...T.typography.headingMd,
    color: T.colors.text.primary,
    fontWeight: '700',
  },

  // Hero
  heroCard: {
    borderRadius: T.borderRadius.lg,
    overflow: 'hidden',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.25)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.lg,
    marginBottom: T.spacing.sm,
  },
  walletIconWrap: {
    borderRadius: T.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.2)',
  },
  walletIconGrad: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextBlock: { flex: 1 },
  heroLabel: {
    ...T.typography.labelSm,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  heroNote: {
    ...T.typography.bodySm,
    color: 'rgba(255,255,255,0.4)',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    borderRadius: T.borderRadius.round,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm - 2,
    alignSelf: 'flex-start',
    marginTop: T.spacing.sm,
  },
  pendingText: {
    ...T.typography.bodySm,
    color: T.colors.accent.warning,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  statBox: {
    flex: 1,
    borderRadius: T.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.md,
    alignItems: 'center',
    gap: T.spacing.xs,
    backgroundColor: T.colors.component.card,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLbl: {
    ...T.typography.labelSm,
    color: T.colors.text.muted,
    textAlign: 'center',
  },

  // Withdraw Card
  withdrawCard: {
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    gap: T.spacing.md,
  },
  withdrawCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  withdrawCardTitle: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    fontWeight: '700',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: T.borderRadius.round,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  readyText: {
    ...T.typography.labelSm,
    color: T.colors.accent.success,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 6,
  },
  progressNote: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    marginTop: -T.spacing.xs,
  },
  withdrawBtn: {
    borderRadius: T.borderRadius.md,
    overflow: 'hidden',
  },
  withdrawBtnOff: { opacity: 0.5 },
  withdrawBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
  },
  withdrawBtnTxt: {
    ...T.typography.labelLg,
    color: T.colors.text.onAccent,
    fontWeight: '700',
  },

  // Form
  formCard: {
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.default,
    padding: T.spacing.lg,
    gap: T.spacing.sm,
  },
  formHeading: {
    ...T.typography.headingSm,
    color: T.colors.text.primary,
    fontWeight: '700',
    marginBottom: T.spacing.sm,
  },
  fieldLabel: {
    ...T.typography.labelMd,
    color: T.colors.text.secondary,
    marginBottom: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.colors.component.input,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    paddingHorizontal: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  inputIcon: { marginRight: T.spacing.sm },
  rupeePrefix: {
    ...T.typography.bodyMd,
    color: T.colors.accent.secondary,
    fontWeight: '700',
    marginRight: T.spacing.sm,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: T.spacing.sm + 2,
    color: T.colors.text.primary,
    ...T.typography.bodyMd,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.colors.border.light,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  infoLabel: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
  },
  infoValue: {
    ...T.typography.labelMd,
    color: T.colors.text.primary,
    fontWeight: '600',
  },

  confirmBtn: {
    borderRadius: T.borderRadius.md,
    overflow: 'hidden',
    marginTop: T.spacing.sm,
  },
  confirmBtnGrad: {
    paddingVertical: T.spacing.md,
    alignItems: 'center',
  },
  confirmBtnTxt: {
    ...T.typography.labelLg,
    color: '#fff',
    fontWeight: '700',
  },
});
