import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreen() {
  return (
    <SafeScreen scrollable={false} padding={0}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.appName}>Connectiqo</Text>
          <Text style={styles.tagline}>Connect. Learn. Grow.</Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <MaterialIcons name="search" size={32} color={UNIFIED_THEME.colors.accent.primary} />
            <Text style={styles.cardTitle}>Find Mentors</Text>
            <Text style={styles.cardDesc}>Browse expert mentors across categories and book 1-on-1 sessions.</Text>
          </View>

          <View style={styles.card}>
            <MaterialIcons name="videocam" size={32} color={UNIFIED_THEME.colors.accent.secondary} />
            <Text style={styles.cardTitle}>Live Video Sessions</Text>
            <Text style={styles.cardDesc}>Connect face-to-face with real-time HD video calls.</Text>
          </View>

          <View style={styles.card}>
            <MaterialIcons name="trending-up" size={32} color={UNIFIED_THEME.colors.accent.success} />
            <Text style={styles.cardTitle}>Track Progress</Text>
            <Text style={styles.cardDesc}>Monitor your sessions, earnings, and growth over time.</Text>
          </View>

          <View style={styles.card}>
            <MaterialIcons name="star" size={32} color={UNIFIED_THEME.colors.accent.warning} />
            <Text style={styles.cardTitle}>Be a Mentor Too</Text>
            <Text style={styles.cardDesc}>Share your expertise and earn by mentoring others.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>More features coming soon</Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: UNIFIED_THEME.spacing.xl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xxxl,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: UNIFIED_THEME.colors.accent.primary,
    letterSpacing: 1,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  tagline: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardsContainer: {
    padding: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.md,
  },
  card: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 16,
    padding: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    gap: UNIFIED_THEME.spacing.sm,
  },
  cardTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
  },
  cardDesc: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },
  footerText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.muted,
    fontStyle: 'italic',
  },
});
