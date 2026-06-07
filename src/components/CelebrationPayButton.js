import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

const T = UNIFIED_THEME;
const B = T.colors.buttons;

const PARTICLE_COUNT = 12;

function buildParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
    rotate: new Animated.Value(0),
    color: [B.primaryGradient[0], B.successGradient[0], B.nebulaGradient[0], '#f472b6'][i % 4],
    size: 5 + (i % 4) * 2,
    angle: (i / PARTICLE_COUNT) * Math.PI * 2 + (i % 3) * 0.2,
    distance: 32 + (i % 5) * 12,
  }));
}

/**
 * Booking CTA — infinite motion when ready (shimmer, glow, confetti, icon wiggle).
 */
export default function CelebrationPayButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  ready = false,
  size = 'default',
  style,
}) {
  const isCheckout = size === 'checkout';
  const particles = useRef(buildParticles()).current;
  const wasReady = useRef(false);

  const scale = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const iconWiggle = useRef(new Animated.Value(0)).current;

  const isActive = ready && !disabled && !loading;

  const runConfettiBurst = useCallback(() => {
    particles.forEach(p => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0);
      p.rotate.setValue(0);

      Animated.parallel([
        Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.spring(p.scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.timing(p.x, {
          toValue: Math.cos(p.angle) * p.distance,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: Math.sin(p.angle) * p.distance - 10,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(280),
          Animated.timing(p.opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [particles]);

  useEffect(() => {
    if (isActive && !wasReady.current) {
      wasReady.current = true;
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.06, friction: 3, tension: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]).start();
      runConfettiBurst();
    }
    if (!isActive) {
      wasReady.current = false;
      shimmer.setValue(0);
      glowOpacity.setValue(0.2);
      glowScale.setValue(1);
      iconWiggle.setValue(0);
      breathe.setValue(1);
    }
  }, [isActive, scale, shimmer, glowOpacity, glowScale, iconWiggle, breathe, runConfettiBurst]);

  useEffect(() => {
    if (!isActive) return undefined;

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    shimmerLoop.start();

    const glowLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.7, duration: 900, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.25, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowScale, { toValue: 1.1, duration: 900, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    );
    glowLoop.start();

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.025, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    breatheLoop.start();

    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconWiggle, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(iconWiggle, { toValue: -1, duration: 350, useNativeDriver: true }),
        Animated.timing(iconWiggle, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(800),
      ]),
    );
    wiggleLoop.start();

    const confettiInterval = setInterval(runConfettiBurst, 3800);

    return () => {
      shimmerLoop.stop();
      glowLoop.stop();
      breatheLoop.stop();
      wiggleLoop.stop();
      clearInterval(confettiInterval);
    };
  }, [isActive, shimmer, glowOpacity, glowScale, breathe, iconWiggle, runConfettiBurst]);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 320],
  });

  const iconRotate = iconWiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const combinedScale = Animated.multiply(scale, breathe);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, friction: 6, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <View style={[styles.wrap, isCheckout && styles.wrapCheckout, style]} pointerEvents="box-none">
      <View style={[styles.buttonStage, isCheckout && styles.buttonStageCheckout]} pointerEvents="box-none">
        <View style={styles.particleOrigin} pointerEvents="none">
          {particles.map(p => {
            const spin = p.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${180 + p.id * 24}deg`],
            });
            return (
              <Animated.View
                key={p.id}
                style={[
                  styles.particle,
                  {
                    width: p.size,
                    height: p.size,
                    marginLeft: -p.size / 2,
                    marginTop: -p.size / 2,
                    borderRadius: p.size / 2,
                    backgroundColor: p.color,
                    opacity: p.opacity,
                    transform: [
                      { translateX: p.x },
                      { translateY: p.y },
                      { scale: p.scale },
                      { rotate: spin },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        {isActive ? (
          <Animated.View
            style={[
              styles.glow,
              isCheckout && styles.glowCheckout,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
            pointerEvents="none"
          />
        ) : null}

        <Animated.View style={{ transform: [{ scale: combinedScale }] }}>
          <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[
              styles.shell,
              isCheckout && styles.shellCheckout,
              isActive && styles.shellReady,
              (disabled || loading) && !isActive && styles.shellDisabled,
            ]}
          >
            <LinearGradient
              colors={
                isActive
                  ? B.successGradient
                  : disabled || loading
                    ? ['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.04)']
                    : ['rgba(167, 139, 250, 0.22)', 'rgba(124, 58, 237, 0.16)']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.gradient, isCheckout && styles.gradientCheckout]}
            >
              {isActive ? (
                <Animated.View
                  style={[styles.shimmerStrip, { transform: [{ translateX: shimmerX }] }]}
                  pointerEvents="none"
                />
              ) : null}

              <View style={styles.row}>
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={isActive ? B.successText : T.colors.accent.primary}
                    style={styles.loader}
                  />
                ) : (
                  <Animated.View style={{ transform: [{ rotate: isActive ? iconRotate : '0deg' }] }}>
                    <MaterialIcons
                      name={isActive ? 'celebration' : disabled ? 'lock-outline' : 'event-available'}
                      size={isCheckout ? 22 : 20}
                      color={
                        isActive
                          ? B.successText
                          : disabled
                            ? T.colors.text.muted
                            : T.colors.accent.primary
                      }
                    />
                  </Animated.View>
                )}
                <Text
                  style={[
                    styles.label,
                    isCheckout && styles.labelCheckout,
                    {
                      color: isActive
                        ? B.successText
                        : disabled
                          ? T.colors.text.muted
                          : T.colors.text.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    marginVertical: 0,
    overflow: 'visible',
  },
  wrapCheckout: {
    width: '100%',
    alignSelf: 'stretch',
  },
  buttonStage: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  buttonStageCheckout: {
    minHeight: 54,
  },
  particleOrigin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
    zIndex: 5,
  },
  glow: {
    position: 'absolute',
    width: '108%',
    height: 56,
    borderRadius: 16,
    backgroundColor: T.colors.accent.success,
  },
  glowCheckout: {
    height: 60,
    borderRadius: 18,
  },
  particle: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  shell: {
    width: '100%',
    minHeight: 48,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: B.secondaryBorder,
  },
  shellCheckout: {
    minHeight: 54,
    borderRadius: 16,
  },
  shellReady: {
    borderColor: B.successBorder,
    ...T.shadows.medium,
  },
  shellDisabled: {
    borderColor: T.colors.border.light,
    opacity: 0.72,
  },
  gradient: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    overflow: 'hidden',
  },
  gradientCheckout: {
    minHeight: 52,
    paddingHorizontal: T.spacing.lg,
  },
  shimmerStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ skewX: '-18deg' }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  loader: { marginRight: 0 },
  label: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  labelCheckout: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
});
