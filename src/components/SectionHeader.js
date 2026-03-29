import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UNIFIED_THEME } from '../unifiedTheme';

export const SectionHeader = ({ title, count = null }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {count !== null && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    marginTop: UNIFIED_THEME.spacing.md,
  },
  title: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.primary.light,
    fontWeight: '600',
  },
});
