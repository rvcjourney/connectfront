import React, { Fragment } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { UNIFIED_THEME } from '../unifiedTheme';

const T = UNIFIED_THEME;
const C = T.colors;
const TB = C.tabBar;

/**
 * Material top tabs — cosmic “sector” layout: aurora edges, nebula wash on active,
 * stellar icon ring, full-width column beam (not a segmented capsule).
 */
export const CapsuleTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const useScroll = state.routes.length > 4;

  const TabInner = ({ route, index }) => {
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : options.title ?? route.name;
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

    const iconColor = isFocused ? C.accent.primary : C.text.secondary;
    const labelColor = isFocused ? C.text.primary : C.text.muted;

    const iconNode = options.tabBarIcon
      ? options.tabBarIcon({ focused: isFocused, color: iconColor })
      : null;

    return (
      <View
        style={[styles.tabColumn, useScroll && styles.tabColumnScroll]}
      >
        {isFocused ? (
          <LinearGradient
            colors={TB.topNavActiveWash}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeWash}
            pointerEvents="none"
          />
        ) : null}

        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: isFocused }}
          accessibilityLabel={typeof label === 'string' ? label : route.name}
          onPress={onPress}
          activeOpacity={0.85}
          style={styles.tabHit}
        >
          <View style={styles.tabContent}>
            {iconNode ? (
              isFocused ? (
                <LinearGradient
                  colors={TB.topNavIconRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconRing}
                >
                  <View style={styles.iconRingInner}>{iconNode}</View>
                </LinearGradient>
              ) : (
                <View style={styles.iconSlot}>{iconNode}</View>
              )
            ) : null}
            <Text
              style={[
                styles.label,
                { color: labelColor },
                isFocused && styles.labelFocused,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {label}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.beamRow}>
          {isFocused ? (
            <LinearGradient
              colors={[C.accent.primary, C.accent.secondary, C.accent.primary]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.beam}
            />
          ) : (
            <View style={styles.beamSlot} />
          )}
        </View>
      </View>
    );
  };

  const tabsRow = useScroll ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
    >
      {state.routes.map((route, index) => (
        <TabInner key={route.key} route={route} index={index} />
      ))}
    </ScrollView>
  ) : (
    <View style={styles.row}>
      {state.routes.map((route, index) => (
        <Fragment key={route.key}>
          <TabInner route={route} index={index} />
          {index < state.routes.length - 1 ? (
            <View style={styles.tabDivider} />
          ) : null}
        </Fragment>
      ))}
    </View>
  );

  return (
    <View style={styles.skyRoot}>
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
        style={[StyleSheet.absoluteFill, styles.skyHaze]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.safeTop,
          { paddingTop: insets.top + T.spacing.md },
        ]}
      >
        <View style={styles.barShell}>
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
            style={styles.auroraTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={TB.flatBarEdge}
            locations={[0, 0.35, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.auroraBottom}
            pointerEvents="none"
          />

          <View style={styles.barInner}>{tabsRow}</View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skyRoot: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: C.primary.void,
  },
  skyHaze: {
    opacity: C.cosmic.hazeOpacity * 0.72,
  },
  safeTop: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  barShell: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: TB.flatBarBase,
    borderBottomWidth: 1,
    borderBottomColor: TB.rimBorder,
    paddingTop: T.spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(124, 58, 237, 0.4)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.32,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.88,
  },
  auroraTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.95,
    zIndex: 2,
  },
  auroraBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    opacity: 0.75,
    zIndex: 2,
  },
  barInner: {
    zIndex: 1,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: T.spacing.md,
    gap: T.spacing.sm,
  },
  tabDivider: {
    width: StyleSheet.hairlineWidth * 2,
    alignSelf: 'stretch',
    marginVertical: T.spacing.md + 2,
    backgroundColor: C.border.light,
    opacity: 0.4,
  },
  tabColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tabColumnScroll: {
    flex: 0,
    minWidth: 92,
    maxWidth: 118,
  },
  activeWash: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 2,
    marginVertical: 4,
    borderRadius: T.borderRadius.md,
    opacity: 0.95,
  },
  tabHit: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.sm,
    paddingHorizontal: T.spacing.xs,
    minHeight: 52,
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  iconSlot: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRingInner: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    backgroundColor: 'rgba(2, 0, 20, 0.72)',
    borderWidth: 1,
    borderColor: TB.rimBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...T.typography.labelSm,
    fontWeight: '600',
    letterSpacing: 0.25,
    textAlign: 'center',
    width: '100%',
  },
  labelFocused: {
    fontWeight: '800',
    textShadowColor: TB.labelShadow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  beamRow: {
    width: '100%',
    paddingHorizontal: T.spacing.sm,
    alignItems: 'center',
  },
  beamSlot: {
    width: '100%',
    height: 3,
  },
  beam: {
    width: '100%',
    height: 3,
    borderRadius: 2,
  },
});
