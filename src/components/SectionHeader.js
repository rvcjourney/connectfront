import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UNIFIED_THEME } from '../unifiedTheme';

export const SectionHeader = ({ title, subtitle, count = null }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.horizontalLine} />
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {count !== null ? (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: UNIFIED_THEME.spacing.md,
    marginTop: UNIFIED_THEME.spacing.sm,
    marginBottom: UNIFIED_THEME.spacing.xs,
    gap: UNIFIED_THEME.spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...UNIFIED_THEME.typography.headingSm,
    fontSize: 17,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: UNIFIED_THEME.colors.accent.primary, // light gray line
    // marginTop: 8,
  },
  subtitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.muted,
    marginTop: UNIFIED_THEME.spacing.xs,
    lineHeight: 18,
  },
  countBadge: {
    backgroundColor: UNIFIED_THEME.colors.component.buttonSecondary,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    minWidth: 28,
    height: 28,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  countText: {
    ...UNIFIED_THEME.typography.labelSm,
    color: UNIFIED_THEME.colors.accent.secondary,
    fontWeight: '700',
  },
});
