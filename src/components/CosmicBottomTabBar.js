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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

const C = UNIFIED_THEME.colors;
const S = UNIFIED_THEME.spacing;
const TB = C.tabBar;
const FAB_SIZE = TB.uploadFabSize ?? 52;
const FAB_LIFT = TB.uploadFabLift ?? 22;

/** Fixed row geometry — all tabs share the same slots */
const INDICATOR_H = 7;
const ICON_SLOT_H = TB.iconSizeFocused + 2;
const LABEL_H = 16;
const TAB_ROW_H = INDICATOR_H + ICON_SLOT_H + LABEL_H + 4;

function resolveLabel(route, options, focused) {
  const raw =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
        ? options.title
        : route.name;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'function') {
    return raw({ focused, color: '', position: 'below-icon' });
  }
  return route.name;
}

function TabIndicator({ active }) {
  return (
    <View style={styles.indicatorRow}>
      {active ? (
        <LinearGradient
          colors={TB.activeIndicatorGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activeIndicator}
        />
      ) : (
        <View style={styles.activeIndicatorGhost} />
      )}
    </View>
  );
}

function UploadFabVisual() {
  return (
    <View style={styles.fabOuterRing}>
      <LinearGradient
        colors={TB.iconRingGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabRingGrad}
      >
        <LinearGradient
          colors={[C.accent.primary, C.accent.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabCircle}
        >
          <MaterialIcons name="file-upload" size={22} color={C.text.onAccent} />
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

function TabColumn({
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
  label,
  color,
  icon,
  isUpload,
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabColumn, isUpload && styles.tabColumnUpload]}
      activeOpacity={0.82}
    >
      <TabIndicator active={isFocused} />
      <View style={[styles.iconSlot, isUpload && styles.iconSlotUpload]}>
        {icon}
      </View>
      {typeof label === 'string' ? (
        <Text
          style={[styles.label, { color }, isFocused && styles.labelFocused]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : (
        <View style={styles.labelSlot}>{label}</View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Bottom tabs: cosmic sky + glass bar; center upload FAB floats above the strip.
 */
export function CosmicBottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  const activeColor = C.accent.primary;
  const inactiveColor = C.text.secondary;

  const makeHandlers = (route, index) => {
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
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };
    return { isFocused, onPress, onLongPress };
  };

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
        style={[styles.barWrap, { paddingBottom: bottomPad }]}
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

        <View style={styles.barRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const { isFocused, onPress, onLongPress } = makeHandlers(
              route,
              index,
            );
            const color = isFocused ? activeColor : inactiveColor;
            const label = resolveLabel(route, options, isFocused);
            const isUpload = !!options.tabBarSpecial;

            const Icon = options.tabBarIcon;
            const icon = isUpload ? (
              <View style={styles.fabFloatWrap} pointerEvents="none">
                <UploadFabVisual />
              </View>
            ) : Icon ? (
              Icon({
                focused: isFocused,
                color,
                size: isFocused ? TB.iconSizeFocused : TB.iconSize,
              })
            ) : null;

            return (
              <TabColumn
                key={route.key}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={
                  options.tabBarAccessibilityLabel ??
                  (typeof label === 'string' ? label : route.name)
                }
                testID={options.tabBarTestID}
                label={label}
                color={color}
                icon={icon}
                isUpload={isUpload}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const FAB_FLOAT_TOP =
  (ICON_SLOT_H - FAB_SIZE) / 2 - FAB_LIFT;

const styles = StyleSheet.create({
  tabRoot: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: C.primary.void,
  },
  tabRootHaze: {
    opacity: C.cosmic.hazeOpacity * 0.72,
  },
  barWrap: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: TB.flatBarBase,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TB.rimBorder,
    paddingTop: S.sm,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(124, 58, 237, 0.35)',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.94,
  },
  topEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.95,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: TAB_ROW_H,
    overflow: 'visible',
  },
  tabColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
    paddingHorizontal: 2,
  },
  tabColumnUpload: {
    overflow: 'visible',
    zIndex: 10,
  },
  indicatorRow: {
    height: INDICATOR_H,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  activeIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  activeIndicatorGhost: {
    width: 28,
    height: 3,
    opacity: 0,
  },
  iconSlot: {
    height: ICON_SLOT_H,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotUpload: {
    overflow: 'visible',
  },
  label: {
    ...UNIFIED_THEME.typography.labelSm,
    height: LABEL_H,
    lineHeight: LABEL_H,
    textAlign: 'center',
    letterSpacing: 0.2,
    width: '100%',
  },
  labelFocused: {
    fontWeight: '800',
    textShadowColor: TB.labelShadow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  labelSlot: {
    height: LABEL_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabFloatWrap: {
    position: 'absolute',
    top: FAB_FLOAT_TOP,
    alignSelf: 'center',
    width: FAB_SIZE + 6,
    height: FAB_SIZE + 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabOuterRing: {
    width: FAB_SIZE + 6,
    height: FAB_SIZE + 6,
    borderRadius: (FAB_SIZE + 6) / 2,
    padding: 2,
    backgroundColor: TB.flatBarBase,
    ...Platform.select({
      ios: {
        shadowColor: C.accent.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: { elevation: 16 },
    }),
  },
  fabRingGrad: {
    flex: 1,
    borderRadius: (FAB_SIZE + 2) / 2,
    padding: 2,
  },
  fabCircle: {
    flex: 1,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
