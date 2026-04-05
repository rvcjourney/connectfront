import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { UNIFIED_THEME } from '../unifiedTheme';

const C = UNIFIED_THEME.colors;
const S = UNIFIED_THEME.spacing;
const TB = C.tabBar;

/**
 * Bottom tabs: full-width strip — CosmicBackground-matched sky + nebula glass bar
 * (flat layout, no floating capsule).
 */
export function CosmicBottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.tabRoot} pointerEvents="box-none">
      <LinearGradient
        colors={C.primary.gradient}
        locations={C.cosmic.mainGradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={C.cosmic.nebulaHaze}
        locations={C.cosmic.nebulaLocations}
        start={{ x: 0.15, y: 1 }}
        end={{ x: 0.85, y: 0 }}
        style={[StyleSheet.absoluteFill, styles.tabRootHaze]}
        pointerEvents="none"
      />

      <View
        style={[
          styles.barWrap,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.barTint} pointerEvents="none">
          <LinearGradient
            colors={TB.glassGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <LinearGradient
          colors={TB.flatBarEdge}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topEdge}
          pointerEvents="none"
        />

        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const raw =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;
            const label =
              typeof raw === 'string'
                ? raw
                : typeof raw === 'function'
                  ? raw({
                      focused: state.index === index,
                      color: '',
                      position: 'below-icon',
                    })
                  : route.name;

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

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const activeColor = C.accent.primary;
            const inactiveColor = C.text.secondary;
            const color = isFocused ? activeColor : inactiveColor;
            const Icon = options.tabBarIcon;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabHit}
                activeOpacity={0.85}
              >
                <View style={styles.tabInner}>
                  {isFocused ? (
                    <LinearGradient
                      colors={[C.accent.primary, C.accent.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activeIndicator}
                    />
                  ) : (
                    <View style={styles.activeIndicatorSlot} />
                  )}
                  <View style={styles.tabContent}>
                    {Icon ? (
                      Icon({
                        focused: isFocused,
                        color,
                        size: isFocused ? TB.iconSizeFocused : TB.iconSize,
                      })
                    ) : null}
                    {typeof label === 'string' ? (
                      <Text
                        style={[
                          styles.label,
                          { color },
                          isFocused && styles.labelFocused,
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    ) : (
                      <View style={styles.labelWrap}>{label}</View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRoot: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: C.primary.void,
  },
  tabRootHaze: {
    opacity: C.cosmic.hazeOpacity * 0.72,
  },
  barWrap: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: TB.flatBarBase,
    borderTopWidth: 1,
    borderTopColor: TB.rimBorder,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(124, 58, 237, 0.4)',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 14 },
    }),
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  topEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.9,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: S.sm + 4,
    minHeight: 54,
  },
  tabHit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabInner: {
    width: '100%',
    alignItems: 'center',
    minHeight: 48,
  },
  activeIndicatorSlot: {
    height: 3,
    marginBottom: 3,
  },
  activeIndicator: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginBottom: 3,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xs,
    paddingBottom: 2,
  },
  label: {
    ...UNIFIED_THEME.typography.labelSm,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  labelFocused: {
    fontWeight: '800',
    textShadowColor: TB.labelShadow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  labelWrap: {
    marginTop: 1,
  },
});
