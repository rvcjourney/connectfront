import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CosmicBackground from '../../components/CosmicBackground';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { INTRO_FLOW } from '../../constants/introFlow';
import { SCREEN_NAMES } from '../../navigators/screenNames';

const ENTRANCE = {
  duration: 520,
  easing: Easing.out(Easing.cubic),
};

function runFadeSlide(opacity, translateY, delay = 0) {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      delay,
      duration: ENTRANCE.duration,
      easing: ENTRANCE.easing,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      delay,
      duration: ENTRANCE.duration,
      easing: ENTRANCE.easing,
      useNativeDriver: true,
    }),
  ]);
}

export default function WelcomeScreen({ navigation }) {
  const logoO = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(28)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;

  const titleO = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;

  const nameO = useRef(new Animated.Value(0)).current;
  const nameY = useRef(new Animated.Value(22)).current;
  const nameScale = useRef(new Animated.Value(0.92)).current;

  const subO = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(18)).current;

  const btnO = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(24)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const statsO = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(20)).current;

  const linkO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(85, [
      runFadeSlide(logoO, logoY, 0),
      runFadeSlide(titleO, titleY, 0),
      Animated.parallel([
        Animated.timing(nameO, {
          toValue: 1,
          duration: ENTRANCE.duration,
          easing: ENTRANCE.easing,
          useNativeDriver: true,
        }),
        Animated.timing(nameY, {
          toValue: 0,
          duration: ENTRANCE.duration,
          easing: ENTRANCE.easing,
          useNativeDriver: true,
        }),
        Animated.spring(nameScale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      runFadeSlide(subO, subY, 0),
      runFadeSlide(btnO, btnY, 0),
      runFadeSlide(statsO, statsY, 0),
      Animated.timing(linkO, {
        toValue: 1,
        duration: 420,
        easing: ENTRANCE.easing,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.06,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const ringRotate = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const ringRotateSlow = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const onPressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.97,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <CosmicBackground style={styles.background}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoOrbitWrap,
              { opacity: logoO, transform: [{ translateY: logoY }] },
            ]}
          >
            <Animated.View
              style={[
                styles.orbitRing,
                styles.orbitRingOuter,
                { transform: [{ rotate: ringRotate }] },
              ]}
            />
            <Animated.View
              style={[
                styles.orbitRing,
                styles.orbitRingInner,
                { transform: [{ rotate: ringRotateSlow }] },
              ]}
            />
            <Animated.View
              style={[styles.logoContainer, { transform: [{ scale: logoPulse }] }]}
            >
              <LinearGradient
                colors={[
                  'rgba(167, 139, 250, 0.35)',
                  'rgba(94, 234, 212, 0.2)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <MaterialIcons
                  name="videocam"
                  size={44}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.eyebrow,
              { opacity: titleO, transform: [{ translateY: titleY }] },
            ]}
          >
            Your universe of learning
          </Animated.Text>

          <Animated.Text
            style={[
              styles.title,
              { opacity: titleO, transform: [{ translateY: titleY }] },
            ]}
          >
            Connect with your
          </Animated.Text>

          <Animated.View
            style={[
              styles.appNameContainer,
              {
                opacity: nameO,
                transform: [{ translateY: nameY }, { scale: nameScale }],
              },
            ]}
          >
            <Text style={styles.appName}>Connectiqo</Text>
            <View style={styles.nameUnderline} />
          </Animated.View>

          <Animated.Text
            style={[
              styles.subtitle,
              { opacity: subO, transform: [{ translateY: subY }] },
            ]}
          >
            Learn from experts — or share your expertise with the world.
          </Animated.Text>

          <View style={styles.chipsRow}>
            <Animated.View
              style={[styles.chip, { opacity: subO, transform: [{ translateY: subY }] }]}
            >
              <MaterialIcons
                name="bolt"
                size={14}
                color={UNIFIED_THEME.colors.accent.secondary}
              />
              <Text style={styles.chipText}>Live sessions</Text>
            </Animated.View>
            <Animated.View
              style={[styles.chip, { opacity: subO, transform: [{ translateY: subY }] }]}
            >
              <MaterialIcons
                name="verified"
                size={14}
                color={UNIFIED_THEME.colors.accent.primary}
              />
              <Text style={styles.chipText}>Trusted mentors</Text>
            </Animated.View>
          </View>

          <Animated.View
            style={{ opacity: btnO, transform: [{ translateY: btnY }], width: '100%' }}
          >
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(SCREEN_NAMES.IntroVideos, {
                  flow: INTRO_FLOW.PRE_AUTH,
                })
              }
              activeOpacity={0.8}
              style={styles.introRow}
            >
              <LinearGradient
                colors={[
                  'rgba(167, 139, 250, 0.14)',
                  'rgba(94, 234, 212, 0.08)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.introGradient}
              >
                <MaterialIcons
                  name="play-circle-filled"
                  size={26}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
                <View style={styles.introTextCol}>
                  <Text style={styles.introTitle}>Watch app intro</Text>
                  <Text style={styles.introSub}>Short clips · 4 steps</Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={UNIFIED_THEME.colors.text.muted}
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonWrap,
              {
                opacity: btnO,
                transform: [{ translateY: btnY }, { scale: btnScale }],
              },
            ]}
          >
            <Pressable
              onPress={() => navigation.navigate('Signup_Screen')}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <LinearGradient
                colors={[
                  UNIFIED_THEME.colors.accent.primary,
                  UNIFIED_THEME.colors.accent.secondary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get started</Text>
                <MaterialIcons name="arrow-forward" size={22} color="#0a0520" />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ opacity: linkO, width: '100%' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login_Screen')}
              activeOpacity={0.7}
              style={styles.signInRow}
            >
              <Text style={styles.signInMuted}>Already have an account? </Text>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.statsContainer,
              { opacity: statsO, transform: [{ translateY: statsY }] },
            ]}
          >
            <View style={styles.statItem}>
              <MaterialIcons
                name="star"
                size={22}
                color={UNIFIED_THEME.colors.accent.primary}
                style={styles.statIconSpacing}
              />
              <Text style={styles.statText}>Expert mentors</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <MaterialIcons
                name="lock"
                size={22}
                color={UNIFIED_THEME.colors.accent.secondary}
                style={styles.statIconSpacing}
              />
              <Text style={styles.statText}>Secure payments</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <MaterialIcons
                name="videocam"
                size={22}
                color={UNIFIED_THEME.colors.accent.primary}
                style={styles.statIconSpacing}
              />
              <Text style={styles.statText}>HD video</Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.xl,
  },

  logoOrbitWrap: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    borderRadius: 999,
    borderStyle: 'dashed',
  },

  orbitRingOuter: {
    width: 132,
    height: 132,
  },

  orbitRingInner: {
    width: 108,
    height: 108,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },

  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: UNIFIED_THEME.colors.accent.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: UNIFIED_THEME.spacing.sm,
    textAlign: 'center',
  },

  title: {
    ...UNIFIED_THEME.typography.headingSm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.xs,
    letterSpacing: 0.3,
    textTransform: 'lowercase',
  },

  appNameContainer: {
    marginBottom: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
  },

  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: UNIFIED_THEME.colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 50,
    textShadowColor: 'rgba(167, 139, 250, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  nameUnderline: {
    marginTop: UNIFIED_THEME.spacing.sm,
    height: 3,
    width: 56,
    borderRadius: 2,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    opacity: 0.9,
  },

  subtitle: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
    lineHeight: 26,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: UNIFIED_THEME.spacing.sm,
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },

  chipText: {
    ...UNIFIED_THEME.typography.labelSm,
    color: UNIFIED_THEME.colors.text.secondary,
    fontWeight: '600',
  },

  introRow: {
    width: '100%',
    marginBottom: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },

  introGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    gap: UNIFIED_THEME.spacing.md,
  },

  introTextCol: {
    flex: 1,
  },

  introTitle: {
    ...UNIFIED_THEME.typography.labelLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
  },

  introSub: {
    marginTop: 2,
    ...UNIFIED_THEME.typography.labelSm,
    color: UNIFIED_THEME.colors.text.muted,
    fontWeight: '600',
  },

  buttonWrap: {
    width: '100%',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  button: {
    width: '100%',
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    overflow: 'hidden',
    ...UNIFIED_THEME.shadows.medium,
  },

  buttonPressed: {
    opacity: 0.95,
  },

  buttonGradient: {
    paddingVertical: UNIFIED_THEME.spacing.lg,
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.sm,
  },

  buttonText: {
    ...UNIFIED_THEME.typography.labelLg,
    color: '#0a0520',
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.sm,
  },

  signInMuted: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.muted,
  },

  signInLink: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.accent.secondary,
    fontWeight: '700',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconSpacing: {
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  statText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },

  divider: {
    width: 1,
    height: 36,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    marginHorizontal: UNIFIED_THEME.spacing.xs,
  },
});
