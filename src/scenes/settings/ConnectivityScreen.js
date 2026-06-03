import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import { REACT_APP_AUTH_URL, AUTH_URL, VIDEO_SDK_AUTH_URL } from '@env';
import { SafeScreen } from '../../components/SafeScreen';
import Button from '../../components/Button';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { SUPABASE_URL } from '../../lib/supabase';

const T = UNIFIED_THEME;

function tokenServerUrl() {
  const raw = REACT_APP_AUTH_URL || AUTH_URL || VIDEO_SDK_AUTH_URL || '';
  return typeof raw === 'string' ? raw.replace(/\r$/, '').trim() : '';
}

function maskHost(url) {
  if (!url) return 'Not configured';
  try {
    const u = new URL(url);
    return u.hostname || url;
  } catch {
    return url.length > 48 ? `${url.slice(0, 46)}…` : url;
  }
}

function Row({ icon, title, subtitle, accent }) {
  return (
    <View style={styles.row}>
      <LinearGradient colors={[`${accent}22`, 'transparent']} style={styles.rowIconBg}>
        <MaterialIcons name={icon} size={22} color={accent} />
      </LinearGradient>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function ConnectivityScreen({ navigation }) {
  const endpoints = useMemo(
    () => ({
      supabase: maskHost(SUPABASE_URL),
      tokenServer: maskHost(tokenServerUrl()),
    }),
    [],
  );

  return (
    <SafeScreen scrollable={false} padding={T.spacing.lg} hasBottomTabs={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connectivity</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Overview of endpoints this build talks to. Add real reachability checks (e.g. NetInfo + ping) when you wire
          the backend.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>From .env</Text>
          <Row
            icon="cloud"
            title="Supabase"
            subtitle={endpoints.supabase}
            accent={T.colors.accent.secondary}
          />
          <View style={styles.divider} />
          <Row
            icon="vpn-key"
            title="Token / auth server"
            subtitle={endpoints.tokenServer}
            accent={T.colors.accent.primary}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Device</Text>
          <Row
            icon="wifi-tethering"
            title="Network status"
            subtitle="Not monitored yet — install @react-native-community/netinfo to show online / offline."
            accent={T.colors.text.muted}
          />
        </View>

        <Button
          text="Run check (placeholder)"
          icon="sync"
          variant="info"
          onPress={() => Toast.show('Wire NetInfo + health checks when backend is ready', Toast.SHORT)}
          style={styles.checkBtnThemed}
        />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.component.input,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...T.typography.bodyLg,
    color: T.colors.text.primary,
    fontWeight: '800',
  },
  headerSpacer: { width: 40 },
  scroll: { paddingBottom: T.spacing.xxxl },
  intro: {
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
    lineHeight: 20,
    marginBottom: T.spacing.lg,
  },
  card: {
    backgroundColor: T.colors.component.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.lg,
    marginBottom: T.spacing.md,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: T.colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: T.spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: T.spacing.md },
  rowIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: T.colors.text.primary, marginBottom: 4 },
  rowSub: { fontSize: 12, color: T.colors.text.secondary, lineHeight: 18 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.colors.border.light,
    marginVertical: T.spacing.md,
    marginLeft: 44 + T.spacing.md,
  },
  checkBtnThemed: { marginVertical: T.spacing.sm },
});
