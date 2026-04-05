import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

export const StatCard = ({
  icon,
  label,
  value,
  unit = '',
  color = UNIFIED_THEME.colors.accent.secondary,
}) => {
  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <View style={styles.topRow}>
        {icon ? (
          <View style={[styles.iconWrap, { borderColor: color }]}>
            <MaterialIcons name={icon} size={20} color={color} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    padding: UNIFIED_THEME.spacing.md,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderLeftWidth: 3,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.sm,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderWidth: 1,
  },
  label: {
    ...UNIFIED_THEME.typography.labelSm,
    color: UNIFIED_THEME.colors.text.secondary,
    flex: 1,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  value: {
    ...UNIFIED_THEME.typography.headingSm,
    fontWeight: '700',
    fontSize: 20,
  },
  unit: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.muted,
    marginLeft: UNIFIED_THEME.spacing.xs,
  },
});
