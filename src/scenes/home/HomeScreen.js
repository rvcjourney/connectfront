import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const DURATION = 480;
const EASE = Easing.out(Easing.cubic);

function fadeUp(opacity, translateY, delay = 0) {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      delay,
      duration: DURATION,
      easing: EASE,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      delay,
      duration: DURATION,
      easing: EASE,
      useNativeDriver: true,
    }),
  ]);
}

const FEATURES = [
  {
    icon: 'search',
    color: UNIFIED_THEME.colors.accent.primary,
    title: 'Find Mentors',
    desc: 'Browse expert mentors across categories and book 1-on-1 sessions.',
  },
  {
    icon: 'videocam',
    color: UNIFIED_THEME.colors.accent.secondary,
    title: 'Live Video Sessions',
    desc: 'Connect face-to-face with real-time HD video calls.',
  },
  {
    icon: 'trending-up',
    color: UNIFIED_THEME.colors.accent.success,
    title: 'Track Progress',
    desc: 'Monitor your sessions, earnings, and growth over time.',
  },
  {
    icon: 'star',
    color: UNIFIED_THEME.colors.accent.warning,
    title: 'Be a Mentor Too',
    desc: 'Share your expertise and earn by mentoring others.',
  },
];

export default function HomeScreen() {
  const heroO = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(26)).current;
  const heroGlow = useRef(new Animated.Value(0.6)).current;

  const cardAnims = useRef(
    FEATURES.map(() => ({
      o: new Animated.Value(0),
      y: new Animated.Value(22),
    })),
  ).current;

  const footerO = useRef(new Animated.Value(0)).current;
  const footerY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const cardAnimations = cardAnims.map((a, i) => fadeUp(a.o, a.y, 0));

    Animated.sequence([
      fadeUp(heroO, heroY, 0),
      Animated.stagger(70, cardAnimations),
      fadeUp(footerO, footerY, 0),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heroGlow, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(heroGlow, {
          toValue: 0.55,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const heroIconScale = heroGlow.interpolate({
    inputRange: [0.55, 1],
    outputRange: [1, 1.08],
  });

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroO,
              transform: [{ translateY: heroY }],
            },
          ]}
        >
          <View style={styles.heroBadge}>
            <Animated.View
              style={[
                styles.heroIconRing,
                {
                  opacity: heroGlow,
                  transform: [{ scale: heroIconScale }],
                },
              ]}
            />
            <LinearGradient
              colors={[
                'rgba(167, 139, 250, 0.45)',
                'rgba(94, 234, 212, 0.25)',
              ]}
              style={styles.heroIconGradient}
            >
              <MaterialIcons
                name="auto-awesome"
                size={36}
                color={UNIFIED_THEME.colors.accent.primary}
              />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Connectiqo</Text>
          <Text style={styles.tagline}>Connect · Learn · Grow</Text>
        </Animated.View>

        <View style={styles.cardsContainer}>
          {FEATURES.map((item, index) => (
            <Animated.View
              key={item.title}
              style={[
                styles.card,
                {
                  opacity: cardAnims[index].o,
                  transform: [{ translateY: cardAnims[index].y }],
                },
              ]}
            >
              <View style={[styles.iconCircle, { borderColor: item.color }]}>
                <MaterialIcons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View
          style={[
            styles.footer,
            { opacity: footerO, transform: [{ translateY: footerY }] },
          ]}
        >
          <MaterialIcons
            name="rocket-launch"
            size={16}
            color={UNIFIED_THEME.colors.text.muted}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>More features launching soon</Text>
        </Animated.View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: UNIFIED_THEME.spacing.xxxl,
    paddingBottom: UNIFIED_THEME.spacing.xs,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
  },
  heroBadge: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  heroIconRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
    backgroundColor: 'rgba(124, 58, 237, 0.07)',
  },
  heroIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: UNIFIED_THEME.colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: UNIFIED_THEME.spacing.sm,
    textShadowColor: 'rgba(167, 139, 250, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: UNIFIED_THEME.colors.accent.secondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  cardsContainer: {
    padding: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: UNIFIED_THEME.spacing.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
  },
  cardBody: {
    flex: 1,
    gap: UNIFIED_THEME.spacing.xs,
  },
  cardTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
  },
  cardDesc: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xl,
    gap: UNIFIED_THEME.spacing.sm,
  },
  footerIcon: {
    marginTop: 1,
  },
  footerText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.muted,
    fontStyle: 'italic',
  },
});
