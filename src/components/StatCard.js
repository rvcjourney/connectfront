import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

export const StatCard = ({
  icon,
  label,
  value,
  unit = '',
  color = UNIFIED_THEME.colors.primary.light,
}) => {
  return (
    <View style={[styles.container, { borderColor: color }]}>
      <View style={styles.header}>
        <MaterialIcons
          name={icon}
          size={24}
          color={color}
          style={styles.icon}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    padding: UNIFIED_THEME.spacing.md,
    borderWidth: 0.2,
    flex: 1,
    marginHorizontal: UNIFIED_THEME.spacing.sm,
    marginVertical: UNIFIED_THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  icon: {
    marginRight: UNIFIED_THEME.spacing.sm,
  },
  label: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    ...UNIFIED_THEME.typography.headingMd,
    fontWeight: '700',
  },
  unit: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginLeft: UNIFIED_THEME.spacing.sm,
  },
});
