import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { useFocusEffect } from '@react-navigation/native';
import { SafeScreen } from '../../components/SafeScreen';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import Button from '../../components/Button';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { payoutApi } from '../../api/payoutApi';
import { useAuth } from '../../hooks/useAuth';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;
const PANEL_BG = '#161432';
const INPUT_BG = '#0f0e2a';

function StatusBadge({ status }) {
  const map = {
    active:      { color: T.colors.accent.success,  bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)',  icon: 'check-circle',    label: 'Active'      },
    pending:     { color: T.colors.accent.warning,  bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', icon: 'hourglass-top',  label: 'KYC Pending' },
    not_started: { color: T.colors.text.muted,      bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', icon: 'info-outline',   label: 'Not set up'  },
  };
  const cfg = map[status] || map.not_started;
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <MaterialIcons name={cfg.icon} size={13} color={cfg.color} />
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});

export default function PayoutSetupScreen({ navigation }) {
  const { profile } = useAuth();
  const [status, setStatus]         = useState('not_started');
  const [accountId, setAccountId]   = useState(null);
  const [kycUrl, setKycUrl]         = useState(null);
  const [upiIdDisplay, setUpiIdDisplay] = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [legalName, setLegalName] = useState(profile?.name || '');
  const [email, setEmail]         = useState(profile?.email || '');
  const [upiId, setUpiId]         = useState('');

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) loadStatus();
    }, [profile?.id]),
  );

  const loadStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await payoutApi.getAccountStatus(profile.id);
      setStatus(res.status || 'not_started');
      setAccountId(res.accountId || null);
      setKycUrl(res.kycUrl || null);
      setUpiIdDisplay(res.upiId || '');
    } catch {
      // no account yet — stay at not_started
      setStatus('not_started');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSetup = async () => {
    if (!legalName.trim()) { Toast.show('Enter your legal / business name'); return; }
    if (!email.trim())     { Toast.show('Enter your email'); return; }
    if (!upiId.trim())     { Toast.show('Enter your UPI ID (e.g. name@upi)'); return; }

    try {
      setSubmitting(true);
      const res = await payoutApi.createLinkedAccount({
        mentorId: profile.id,
        legalName: legalName.trim(),
        email: email.trim(),
        upiId: upiId.trim(),
      });
      setAccountId(res.accountId);
      setKycUrl(res.kycUrl);
      setStatus('pending');
      setUpiIdDisplay(upiId.trim());
      Toast.show('Account created! Complete KYC to activate payouts.');
    } catch (e) {
      Toast.show(e.message || 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenKyc = () => {
    if (!kycUrl) return;
    Linking.openURL(kycUrl).catch(() => Toast.show('Could not open KYC link'));
  };

  const isSetUp = status !== 'not_started';

  return (
    <SafeScreen hasBottomTabs={false} includeTopInset={false}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadStatus(true)} tintColor={T.colors.accent.secondary} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payout Setup</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: T.spacing.sm }}>
            <Text style={s.cardTitle}>Payout account</Text>
            <StatusBadge status={status} />
          </View>
          <Text style={s.cardSub}>
            Set up your UPI ID to get paid directly after each session. KYC is required by Razorpay to activate payouts.
          </Text>
        </View>

        {/* How it works */}
        <View style={s.card}>
          <Text style={s.cardTitle}>How payouts work</Text>
          {[
            { icon: 'payments',          text: 'Learner pays for a session' },
            { icon: 'call-split',        text: '80% credited to your account, 20% platform fee' },
            { icon: 'account-balance-wallet', text: 'Request withdrawal from My Wallet (min ₹5,000)' },
            { icon: 'send',              text: 'Money sent to your UPI ID within 1–2 business days' },
          ].map((item, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepIcon}>
                <MaterialIcons name={item.icon} size={18} color={T.colors.accent.secondary} />
              </View>
              <Text style={s.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Status card (if already set up) */}
        {isSetUp && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Account Status</Text>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Razorpay Account ID</Text>
              <Text style={s.infoValue} numberOfLines={1}>{accountId}</Text>
            </View>

            {upiIdDisplay ? (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>UPI ID</Text>
                <Text style={s.infoValue}>{upiIdDisplay}</Text>
              </View>
            ) : null}

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>KYC Status</Text>
              <StatusBadge status={status} />
            </View>

            {status === 'pending' && (
              <View style={s.kycNotice}>
                <MaterialIcons name="info-outline" size={16} color={T.colors.accent.warning} />
                <Text style={s.kycNoticeText}>
                  Complete your KYC on Razorpay to activate payouts. Tap below to open the KYC form.
                </Text>
              </View>
            )}

            {status === 'active' && (
              <View style={s.activeNotice}>
                <MaterialIcons name="check-circle" size={16} color={T.colors.accent.success} />
                <Text style={s.activeNoticeText}>
                  Your account is active. Payouts will be processed to your UPI ID.
                </Text>
              </View>
            )}

            {status !== 'active' && kycUrl && accountId && (
              <Button
                text="Complete KYC on Razorpay"
                icon="open-in-browser"
                variant="warning"
                onPress={handleOpenKyc}
                style={s.kycBtnThemed}
              />
            )}
          </View>
        )}

        {/* Setup form (if not set up yet) */}
        {!isSetUp && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Set up payout account</Text>
            <Text style={s.cardSub}>
              Your details are shared with Razorpay to create a linked account for receiving payments.
            </Text>

            <Text style={s.fieldLabel}>Legal / Business Name</Text>
            <View style={s.inputWrap}>
              <MaterialIcons name="person" size={18} color={T.colors.text.muted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={legalName}
                onChangeText={setLegalName}
                placeholder="Your full name or business name"
                placeholderTextColor={T.colors.text.muted}
              />
            </View>

            <Text style={s.fieldLabel}>Email</Text>
            <View style={s.inputWrap}>
              <MaterialIcons name="email" size={18} color={T.colors.text.muted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={T.colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={s.fieldLabel}>UPI ID</Text>
            <View style={s.inputWrap}>
              <MaterialIcons name="phone-android" size={18} color={T.colors.text.muted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="yourname@upi"
                placeholderTextColor={T.colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={s.fieldHint}>
              After setup, you'll be taken to Razorpay to complete a quick KYC verification.
            </Text>

            <Button
              text={submitting ? 'Setting up…' : 'Create Payout Account'}
              icon="account-balance"
              variant="primary"
              onPress={handleSetup}
              disabled={submitting}
              loading={submitting}
              style={s.setupBtnThemed}
            />
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="Loading payout status..." />
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { padding: T.spacing.lg, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: T.spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PANEL_BG,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, color: C.text.primary, fontWeight: '800' },

  card: {
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
    gap: T.spacing.sm,
  },
  cardTitle: { fontSize: 16, color: C.text.primary, fontWeight: '800', marginBottom: 2 },
  cardSub:   { fontSize: 13, color: C.text.muted, lineHeight: 19, marginBottom: T.spacing.xs },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: T.spacing.md, paddingVertical: 4 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: S.accentTeal,
    borderWidth: 1, borderColor: 'rgba(94,234,212,0.25)',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  stepText: { fontSize: 14, color: C.text.secondary, flex: 1, lineHeight: 22 },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(167,139,250,0.15)',
  },
  infoLabel: { fontSize: 13, color: C.text.muted },
  infoValue: { fontSize: 13, color: C.text.primary, fontWeight: '700', maxWidth: '60%' },

  kycNotice: {
    flexDirection: 'row', gap: T.spacing.sm,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)',
    borderRadius: T.borderRadius.md,
    padding: T.spacing.md,
    marginTop: T.spacing.xs,
  },
  kycNoticeText: { ...T.typography.bodySm, color: T.colors.accent.warning, flex: 1, lineHeight: 18 },

  activeNotice: {
    flexDirection: 'row', gap: T.spacing.sm,
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
    borderRadius: T.borderRadius.md,
    padding: T.spacing.md,
  },
  activeNoticeText: { ...T.typography.bodySm, color: T.colors.accent.success, flex: 1, lineHeight: 18 },

  kycBtnThemed: { marginVertical: 0, marginTop: T.spacing.xs },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: PURPLE_LINK, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  fieldHint:  { fontSize: 13, color: C.text.muted, lineHeight: 18, marginTop: T.spacing.xs },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)',
    paddingHorizontal: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  inputIcon: { marginRight: T.spacing.sm },
  input: {
    flex: 1, paddingVertical: T.spacing.sm + 2,
    color: C.text.primary, fontSize: 15,
  },

  setupBtnThemed: { marginVertical: 0, marginTop: T.spacing.sm },
});
