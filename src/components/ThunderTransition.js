import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGrad, Stop, Path, Line } from 'react-native-svg';
import { UNIFIED_THEME } from '../unifiedTheme';

const GOLD = UNIFIED_THEME.colors.accent.primary;
const TEAL = UNIFIED_THEME.colors.accent.secondary;
const VOID = UNIFIED_THEME.colors.primary.void;

const BOLT_PATH =
  'M52 2 L28 72 L44 72 L20 148 L68 78 L50 78 L64 2 Z';

const MINI_BOLT_PATH =
  'M18 2 L10 14 L15 14 L7 28 L22 16 L16 16 L20 2 Z';

function MainBolt({ height }) {
  const w = height * 0.46;
  return (
    <Svg width={w} height={height} viewBox="0 0 88 150">
      <Defs>
        <SvgGrad id="core" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="0.35" stopColor="#fff8dc" stopOpacity="1" />
          <Stop offset="0.7" stopColor={GOLD} stopOpacity="1" />
          <Stop offset="1" stopColor={TEAL} stopOpacity="0.95" />
        </SvgGrad>
      </Defs>
      <Path
        d={BOLT_PATH}
        fill="url(#core)"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth={2.2}
        strokeLinejoin="miter"
      />
    </Svg>
  );
}

function MiniBolt({ size = 36 }) {
  return (
    <Svg width={size} height={size * 1.55} viewBox="0 0 36 56">
      <Path
        d={MINI_BOLT_PATH}
        fill="#fffef0"
        stroke={GOLD}
        strokeWidth={1.2}
        strokeLinejoin="miter"
      />
    </Svg>
  );
}

function JaggedArc({ path, color, strokeWidth = 2 }) {
  return (
    <Svg width={120} height={100} viewBox="-60 -10 120 100">
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </Svg>
  );
}

/**
 * Full-screen thunder strike overlay — sharp/angular, no pill/capsule shapes.
 */
export function ThunderTransition({ visible, origin, onStrike, onDismiss }) {
  const { width, height } = useWindowDimensions();
  const onStrikeRef = useRef(onStrike);
  const onDismissRef = useRef(onDismiss);
  onStrikeRef.current = onStrike;
  onDismissRef.current = onDismiss;

  const scrim = useRef(new Animated.Value(0)).current;
  const flash1 = useRef(new Animated.Value(0)).current;
  const flash2 = useRef(new Animated.Value(0)).current;
  const flash3 = useRef(new Animated.Value(0)).current;
  const tint = useRef(new Animated.Value(0)).current;
  const boltDrop = useRef(new Animated.Value(0)).current;
  const boltOpacity = useRef(new Animated.Value(0)).current;
  const boltFlicker = useRef(new Animated.Value(1)).current;
  const forkL = useRef(new Animated.Value(0)).current;
  const forkR = useRef(new Animated.Value(0)).current;
  const forkC = useRef(new Animated.Value(0)).current;
  const originBolt = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const beam = useRef(new Animated.Value(0)).current;

  const boltH = Math.min(height * 0.52, 340);
  const boltW = boltH * 0.46;
  const beamFullH = height * 0.55;
  const originX = origin?.x ?? width * 0.88;
  const originY = origin?.y ?? height * 0.09;
  const boltLeft = width / 2 - boltW / 2;

  useEffect(() => {
    if (!visible) return undefined;

    scrim.setValue(0);
    flash1.setValue(0);
    flash2.setValue(0);
    flash3.setValue(0);
    tint.setValue(0);
    boltDrop.setValue(0);
    boltOpacity.setValue(0);
    boltFlicker.setValue(1);
    forkL.setValue(0);
    forkR.setValue(0);
    forkC.setValue(0);
    originBolt.setValue(0);
    shake.setValue(0);
    fadeOut.setValue(1);
    beam.setValue(0);

    const pop = (val, peak, up = 35, down = 90) =>
      Animated.sequence([
        Animated.timing(val, {
          toValue: peak,
          duration: up,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(val, {
          toValue: 0,
          duration: down,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

    const forkBurst = (val, delay = 0) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(val, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);

    const shakeSeq = Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 24, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -0.75, duration: 22, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.45, duration: 20, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -0.2, duration: 18, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 16, useNativeDriver: true }),
    ]);

    const strike = Animated.parallel([
      Animated.timing(scrim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(originBolt, {
          toValue: 1,
          duration: 50,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(originBolt, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(40),
        Animated.parallel([
          pop(flash2, 0.92, 25, 110),
          Animated.sequence([
            Animated.timing(tint, { toValue: 0.5, duration: 30, useNativeDriver: true }),
            Animated.timing(tint, { toValue: 0.1, duration: 140, useNativeDriver: true }),
            Animated.timing(tint, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
          shakeSeq,
          Animated.sequence([
            Animated.timing(boltOpacity, { toValue: 1, duration: 20, useNativeDriver: true }),
            Animated.spring(boltDrop, {
              toValue: 1,
              friction: 7,
              tension: 220,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(boltFlicker, { toValue: 0.35, duration: 30, useNativeDriver: true }),
              Animated.timing(boltFlicker, { toValue: 1, duration: 40, useNativeDriver: true }),
              Animated.timing(boltFlicker, { toValue: 0.5, duration: 25, useNativeDriver: true }),
              Animated.timing(boltFlicker, { toValue: 1, duration: 35, useNativeDriver: true }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(10),
            Animated.timing(beam, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(beam, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }),
          ]),
          forkBurst(forkL, 20),
          forkBurst(forkR, 35),
          forkBurst(forkC, 50),
        ]),
      ]),
      Animated.sequence([Animated.delay(120), pop(flash3, 0.55, 20, 70)]),
    ]);

    const sequence = Animated.sequence([
      pop(flash1, 0.35, 30, 60),
      Animated.delay(20),
      strike,
      Animated.delay(40),
    ]);

    sequence.start(({ finished }) => {
      if (!finished) return;
      onStrikeRef.current?.();
      Animated.parallel([
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(boltOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(tint, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished: fadeDone }) => {
        if (fadeDone) onDismissRef.current?.();
      });
    });

    return () => sequence.stop();
  }, [visible, width, height]);

  const shakeX = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-14, 14],
  });

  const boltTranslateY = boltDrop.interpolate({
    inputRange: [0, 1],
    outputRange: [-boltH * 0.85, 0],
  });

  const boltScale = boltDrop.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.55, 1.08, 1],
  });

  const forkScale = (val) =>
    val.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1.4],
    });

  const beamScaleY = beam.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });

  const beamTranslateY = beam.interpolate({
    inputRange: [0, 1],
    outputRange: [-beamFullH / 2, 0],
  });

  const beamOpacity = beam.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.7, 0],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View
        style={[
          styles.root,
          { width, height, opacity: fadeOut, transform: [{ translateX: shakeX }] },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.scrim,
            {
              opacity: scrim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.72],
              }),
            },
          ]}
        />

        <Animated.View style={[styles.flashLayer, { opacity: flash1 }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.35)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.flashLayer, { opacity: flash2 }]}>
          <LinearGradient
            colors={['#ffffff', 'rgba(240,216,117,0.5)', 'rgba(94,234,212,0.2)', 'transparent']}
            locations={[0, 0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.flashLayer, { opacity: flash3 }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.tintLayer, { opacity: tint }]} />

        {/* Sharp vertical light beam from origin — no rounded glow */}
        <Animated.View
          style={[
            styles.beam,
            {
              left: originX - 1,
              top: originY,
              height: beamFullH,
              opacity: beamOpacity,
              transform: [{ translateY: beamTranslateY }, { scaleY: beamScaleY }],
            },
          ]}
        />

        {/* Mini bolt at button origin */}
        <Animated.View
          style={[
            styles.originBolt,
            {
              left: originX - 18,
              top: originY - 28,
              opacity: originBolt,
              transform: [
                {
                  scale: originBolt.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <MiniBolt size={36} />
        </Animated.View>

        {/* Jagged fork arcs — angular, not circular rings */}
        <Animated.View
          style={[
            styles.fork,
            { left: width * 0.18, top: height * 0.28, opacity: forkL, transform: [{ scale: forkScale(forkL) }, { rotate: '-28deg' }] },
          ]}
        >
          <JaggedArc
            path="M0 0 L-12 22 L-4 22 L-20 48 L8 24 L0 24 L14 52"
            color="rgba(240,216,117,0.85)"
            strokeWidth={2}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.fork,
            { right: width * 0.16, top: height * 0.32, opacity: forkR, transform: [{ scale: forkScale(forkR) }, { rotate: '22deg' }] },
          ]}
        >
          <JaggedArc
            path="M0 0 L10 20 L4 20 L18 44 L-6 22 L0 22 L-14 50"
            color="rgba(94,234,212,0.8)"
            strokeWidth={2}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.fork,
            { left: width * 0.42, top: height * 0.18, opacity: forkC, transform: [{ scale: forkScale(forkC) }] },
          ]}
        >
          <JaggedArc
            path="M0 0 L-6 14 L-2 14 L-10 28 L4 16 L0 16 L8 32"
            color="rgba(255,255,255,0.75)"
            strokeWidth={1.5}
          />
        </Animated.View>

        {/* Main bolt */}
        <Animated.View
          style={[
            styles.boltWrap,
            {
              left: boltLeft,
              top: height * 0.14,
              height: boltH,
              opacity: Animated.multiply(boltOpacity, boltFlicker),
              transform: [{ translateY: boltTranslateY }, { scale: boltScale }],
            },
          ]}
        >
          <MainBolt height={boltH} />
        </Animated.View>

        {/* Sharp slash lines radiating from strike point */}
        <Animated.View style={[styles.slashWrap, { opacity: forkL, left: width / 2 - 60, top: height * 0.2 }]}>
          <Svg width={120} height={80} viewBox="0 0 120 80">
            <Line x1="60" y1="0" x2="20" y2="70" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
            <Line x1="60" y1="0" x2="100" y2="65" stroke="rgba(240,216,117,0.45)" strokeWidth={1.5} />
            <Line x1="60" y1="0" x2="60" y2="75" stroke="rgba(94,234,212,0.35)" strokeWidth={1} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VOID,
  },
  flashLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TEAL,
  },
  beam: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  originBolt: {
    position: 'absolute',
  },
  fork: {
    position: 'absolute',
  },
  boltWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  slashWrap: {
    position: 'absolute',
  },
});
