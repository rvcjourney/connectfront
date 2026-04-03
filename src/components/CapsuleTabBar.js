import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UNIFIED_THEME } from '../unifiedTheme';

export const CapsuleTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingTop: UNIFIED_THEME.spacing.md,
    paddingBottom: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  container: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.sm,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(248, 85, 156, 0.15)',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.accent.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: UNIFIED_THEME.colors.text.muted,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '700',
  },
});
