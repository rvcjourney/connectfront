import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { UNIFIED_THEME } from '../unifiedTheme';

/**
 * Cosmic-themed loader: dual-tone orbit rings + soft pulsing core.
 */
export function CosmicLoader({ size = 56 }) {
  const spin = useRef(new Animated.Value(0)).current;
  const spinReverse = useRef(new Animated.Value(0)).current;
  const corePulse = useRef(new Animated.Value(0.5)).current;
  const coreScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(spinReverse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(corePulse, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(coreScale, {
            toValue: 1.15,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(corePulse, {
            toValue: 0.35,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(coreScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const rotateRev = spinReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const borderW = Math.max(3, size * 0.1);
  const innerRing = size * 0.72;
  const ringInset = (size - innerRing) / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ringOuter,
          {
            width: size,
            height: size,
            transform: [{ rotate }],
          },
        ]}
      >
        <View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: borderW,
              borderColor: 'rgba(167, 139, 250, 0.12)',
              borderTopColor: UNIFIED_THEME.colors.accent.primary,
              borderRightColor: UNIFIED_THEME.colors.accent.secondary,
            },
          ]}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.ringInnerSlot,
          {
            width: innerRing,
            height: innerRing,
            left: ringInset,
            top: ringInset,
            transform: [{ rotate: rotateRev }],
          },
        ]}
      >
        <View
          style={[
            styles.ring,
            {
              width: innerRing,
              height: innerRing,
              borderRadius: innerRing / 2,
              borderWidth: borderW * 0.65,
              borderColor: 'rgba(94, 234, 212, 0.1)',
              borderBottomColor: UNIFIED_THEME.colors.accent.secondary,
              borderLeftColor: 'rgba(240, 216, 117, 0.65)',
            },
          ]}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.core,
          {
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: size * 0.11,
            opacity: corePulse,
            transform: [{ scale: coreScale }],
            backgroundColor: UNIFIED_THEME.colors.accent.secondary,
            shadowColor: UNIFIED_THEME.colors.accent.primary,
          },
        ]}
      />
    </View>
  );
}

/**
 * @deprecated Use CosmicLoader; kept for any legacy imports.
 */
export const PulsingDots = ({ size = 16 }) => (
  <CosmicLoader size={Math.max(52, Math.round(size * 2.75))} />
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInnerSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  core: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
});
