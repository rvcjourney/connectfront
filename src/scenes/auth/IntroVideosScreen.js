/**
 * IntroVideosScreen — full-screen onboarding carousel after Welcome or right after login.
 *
 * - Swipe horizontally between clips (react-native-tab-view); dots at the bottom jump to pages.
 * - Each page is IntroClipScene (video or placeholder if no asset URL is set in introClips.js).
 * - flow=POST_AUTH: Skip/Close marks intro seen (AsyncStorage) and goes to main tabs.
 * - flow=PRE_AUTH: dismiss returns to Welcome (or back stack).
 * - Android hardware back acts like leaving the intro.
 */
import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import { TabView } from 'react-native-tab-view';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CosmicBackground from '../../components/CosmicBackground';
import { APP_DISPLAY_NAME, INTRO_CLIPS } from '../../constants/introClips';
import { INTRO_FLOW } from '../../constants/introFlow';
import { postLoginIntroSeenKey } from '../../constants/storageKeys';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { UNIFIED_THEME } from '../../unifiedTheme';
import IntroClipScene from './IntroClipScene';

const C = UNIFIED_THEME.colors;
const TB = C.tabBar;

/** Persist “intro completed” for post-login flow, then navigate away from this screen. */
async function persistIntroDismissal(navigation, { flow, userId }) {
  try {
    if (flow === INTRO_FLOW.POST_AUTH && userId) {
      await AsyncStorage.setItem(postLoginIntroSeenKey(userId), '1');
    }
  } catch {
    /* Storage failure should not trap the user on the intro. */
  }
  if (flow === INTRO_FLOW.POST_AUTH) {
    navigation.replace(SCREEN_NAMES.RootUnifiedTabs);
    return;
  }
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.replace(SCREEN_NAMES.Welcome);
  }
}

/** Bottom dock: pill-style dots; active page shows elongated gradient tab. */
function IntroDotTabBar({ navigationState, jumpTo }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.dockOuter,
        { paddingBottom: Math.max(insets.bottom, UNIFIED_THEME.spacing.md) },
      ]}
    >
      <LinearGradient
        colors={[
          'rgba(6, 6, 31, 0.92)',
          'rgba(12, 12, 40, 0.96)',
        ]}
        style={styles.dockGlass}
      >
        <LinearGradient
          colors={TB.flatBarEdge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dockTopEdge}
        />
        <View style={styles.dotsRow}>
          {navigationState.routes.map((route, i) => {
            const active = navigationState.index === i;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => jumpTo(route.key)}
                style={styles.dotHit}
                activeOpacity={0.85}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Intro ${i + 1} of ${navigationState.routes.length}`}
              >
                {active ? (
                  <LinearGradient
                    colors={TB.topNavActiveWash}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dotActive}
                  />
                ) : (
                  <View style={styles.dot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

/** Top bar: app mark + name; Skip and Close both end the intro (same as persistIntroDismissal). */
function IntroBrandHeader({ onLeave }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        <LinearGradient
          colors={[
            'rgba(167, 139, 250, 0.35)',
            'rgba(94, 234, 212, 0.2)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandLogo}
        >
          <MaterialIcons
            name="videocam"
            size={22}
            color={C.accent.primary}
          />
        </LinearGradient>
        <Text style={styles.brandName}>{APP_DISPLAY_NAME}</Text>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={() => onLeave()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.skipHit}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Skip intro"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onLeave()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeHit}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Close intro"
        >
          <MaterialIcons name="close" size={26} color={C.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function IntroVideosScreen({ navigation, route }) {
  const { user, session } = useContext(AuthContext);
  const userId = user?.id ?? session?.user?.id;
  /** PRE_AUTH: from Welcome. POST_AUTH: one-time after sign-in (see RootNavigator). */
  const flow = route.params?.flow ?? INTRO_FLOW.PRE_AUTH;
  const insets = useSafeAreaInsets();
  const layout = useWindowDimensions();

  const statusBarOffset =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const topInset =
    Math.max(insets.top, statusBarOffset) + UNIFIED_THEME.spacing.lg;
  const [index, setIndex] = useState(0);
  /** TabView route keys must match INTRO_CLIPS[].route in introClips.js */
  const routes = useMemo(
    () => INTRO_CLIPS.map(clip => ({ key: clip.route })),
    [],
  );

  const leaveIntro = useCallback(() => {
    persistIntroDismissal(navigation, { flow, userId });
  }, [navigation, flow, userId]);

  useFocusEffect(
    useCallback(() => {
      /* Android: back button exits intro instead of leaving an empty stack. */
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        leaveIntro();
        return true;
      });
      return () => sub.remove();
    }, [leaveIntro]),
  );

  const renderScene = useCallback(
    ({ route }) => {
      const clip = INTRO_CLIPS.find(c => c.route === route.key);
      const sceneIndex = INTRO_CLIPS.findIndex(c => c.route === route.key);
      /* Only the visible page plays video (IntroClipScene passes paused=!isActive to Video). */
      return (
        <IntroClipScene clip={clip} isActive={index === sceneIndex} />
      );
    },
    [index],
  );

  const renderTabBar = useCallback(
    props => <IntroDotTabBar {...props} />,
    [],
  );

  return (
    <CosmicBackground style={styles.bg}>
      <View
        style={[
          styles.safe,
          {
            paddingTop: topInset,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <IntroBrandHeader onLeave={leaveIntro} />

        <LinearGradient
          colors={TB.flatBarEdge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerRule}
        />

        {/* Pager: swipe between intro clips; custom tab bar = dots only (renderTabBar). */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          tabBarPosition="bottom"
          swipeEnabled
          lazy
          lazyPreloadDistance={1}
          style={styles.tabView}
        />
      </View>
    </CosmicBackground>
  );
}

/* --- Layout: header + full-height TabView + bottom dot dock (IntroDotTabBar) --- */
const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingTop: UNIFIED_THEME.spacing.xs,
    paddingBottom: UNIFIED_THEME.spacing.md,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border.default,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(167, 139, 250, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skipHit: {
    paddingVertical: UNIFIED_THEME.spacing.sm,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
  },
  skipText: {
    ...UNIFIED_THEME.typography.labelLg,
    color: C.accent.secondary,
    fontWeight: '700',
  },
  closeHit: {
    padding: UNIFIED_THEME.spacing.xs,
  },
  headerRule: {
    height: 1,
    marginHorizontal: UNIFIED_THEME.spacing.md,
    opacity: 0.55,
    borderRadius: 1,
  },
  tabView: {
    flex: 1,
  },
  dockOuter: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingTop: UNIFIED_THEME.spacing.md,
  },
  dockGlass: {
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: C.border.light,
    overflow: 'hidden',
  },
  dockTopEdge: {
    height: 2,
    opacity: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
  },
  dotHit: {
    padding: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.15)',
  },
  dotActive: {
    width: 28,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(240, 216, 117, 0.35)',
  },
});
