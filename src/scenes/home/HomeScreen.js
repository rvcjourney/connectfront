import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MENTOR_CATEGORIES } from '../../constants/mentorCategories';

/** Keep only one session row on home. */
const HOME_CATEGORY_COUNT = 1;

const T = UNIFIED_THEME;
const C = T.colors;

const APP_NAME = 'Connectiqo';
const APP_TAGLINE = 'Connect · Learn · Grow';
const HOME_GREETING = 'Discover mentor-led learning';

/** Portrait video-style preview tiles per category row (horizontal scroll, demo) */
const DUMMY_BOX_COUNT = 6;
const VIDEO_TILE_WIDTH = 108;
const VIDEO_TILE_HEIGHT = Math.round((VIDEO_TILE_WIDTH * 16) / 9);
const DUMMY_LABELS = ['Preview 1', 'Preview 2', 'Preview 3', 'Preview 4', 'Preview 5', 'Preview 6'];
const INTRO_VIDEO_ID = 'dQw4w9WgXcQ';
const HOME_YOUTUBE_VIDEOS = [
  { id: 'M7lc1UVf-VE', title: 'Getting Started' },
  { id: 'ysz5S6PUM-U', title: 'Mentor Tips' },
  { id: 'HluANRwPyNo', title: 'Session Walkthrough' },
  { id: 'ScMzIvxBSi4', title: 'Learning Path' },
  { id: 'aqz-KE-bpKQ', title: 'Community Stories' },
  { id: 'jNQXAC9IVRw', title: 'Quick Intro' },
];

const DURATION = 420;
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

function iconForCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('technology')) return 'memory';
  if (n.includes('software')) return 'code';
  if (n.includes('ai') || n.includes('machine')) return 'psychology';
  return 'category';
}

const CATEGORY_GRADIENTS = [
  ['rgba(167, 139, 250, 0.4)', 'rgba(94, 234, 212, 0.14)'],
  ['rgba(94, 234, 212, 0.32)', 'rgba(56, 189, 248, 0.12)'],
  ['rgba(236, 72, 153, 0.25)', 'rgba(167, 139, 250, 0.14)'],
  ['rgba(240, 216, 117, 0.28)', 'rgba(94, 234, 212, 0.1)'],
  ['rgba(52, 211, 153, 0.22)', 'rgba(94, 234, 212, 0.12)'],
];

/** Wide cinematic dummy video under the “Intro” heading. */
function IntroVideoBar({ onOpenVideo }) {
  const g = CATEGORY_GRADIENTS[0];
  const thumbColors = ['rgba(4, 3, 20, 1)', g[0], g[1], 'rgba(1, 0, 12, 1)'];

  return (
    <View style={styles.introBlock}>
      <View style={styles.introHeadRow}>
        <View style={styles.introHeadLeft}>
          <View style={styles.introTitleRow}>
            <MaterialIcons name="play-circle-filled" size={20} color={C.accent.primary} />
            <Text style={styles.sectionTitle}>Intro</Text>
          </View>
        </View>
        <View style={styles.introDurationChip}>
          <MaterialIcons name="schedule" size={12} color={C.text.muted} />
          <Text style={styles.introDurationText}>01:24</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.introVideoOuter}
        activeOpacity={0.9}
        onPress={() => onOpenVideo(INTRO_VIDEO_ID)}
      >
        <LinearGradient
          colors={['rgba(167, 139, 250, 0.42)', 'rgba(94, 234, 212, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.introVideoBorder}
        >
          <View style={styles.introVideoClip}>
            <LinearGradient
              colors={thumbColors}
              locations={[0, 0.35, 0.72, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.introVideoThumb}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.16)', 'transparent', 'rgba(0,0,0,0.45)']}
                locations={[0, 0.45, 1]}
                style={styles.videoVignette}
              />

              <View style={styles.introTopRow}>
                <View style={styles.introBadge}>
                  <MaterialIcons name="auto-awesome" size={12} color={C.accent.primary} />
                  <Text style={styles.introBadgeText}>Featured</Text>
                </View>
                <MaterialIcons name="videocam" size={18} color="rgba(244, 244, 255, 0.72)" />
              </View>

              <View style={styles.videoPlayWrap}>
                <View style={styles.introPlayRing}>
                  <MaterialIcons
                    name="play-arrow"
                    size={40}
                    color={C.text.onAccent}
                    style={styles.introPlayIcon}
                  />
                </View>
              </View>

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.88)']}
                style={styles.introBottomScrim}
              >
                <Text style={styles.introVideoTitle} numberOfLines={1}>
                  Welcome to {APP_NAME}
                </Text>
              </LinearGradient>
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function CategoryRow({ categoryTitle, sectionIndex, onOpenVideo }) {
  const iconName = iconForCategory(categoryTitle);
  const accent = CATEGORY_GRADIENTS[sectionIndex % CATEGORY_GRADIENTS.length];

  const dummies = Array.from({ length: DUMMY_BOX_COUNT }, (_, i) => ({
    key: `${categoryTitle}-${i}`,
    label: DUMMY_LABELS[i] || `Preview ${i + 1}`,
    tone: (sectionIndex + i) % CATEGORY_GRADIENTS.length,
  }));

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryTitleRow}>
        <LinearGradient
          colors={accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryTitleIcon}
        >
          <MaterialIcons name={iconName} size={20} color={C.text.primary} />
        </LinearGradient>
        <View style={styles.categoryTitleTextWrap}>
          <Text style={styles.categoryTitleText} numberOfLines={2}>
            {categoryTitle}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dummyRow}
        decelerationRate="fast"
      >
        {dummies.map(d => {
          const g = CATEGORY_GRADIENTS[d.tone % CATEGORY_GRADIENTS.length];
          const thumbColors = ['rgba(5, 3, 22, 1)', g[0], g[1], 'rgba(2, 0, 14, 1)'];
          const video = HOME_YOUTUBE_VIDEOS[(sectionIndex * DUMMY_BOX_COUNT + d.tone) % HOME_YOUTUBE_VIDEOS.length];
          return (
            <TouchableOpacity
              key={d.key}
              style={styles.videoCardOuter}
              activeOpacity={0.9}
              onPress={() => onOpenVideo(video.id)}
            >
              <LinearGradient
                colors={['rgba(167, 139, 250, 0.45)', 'rgba(94, 234, 212, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.videoCardBorder}
              >
                <View style={styles.videoThumbClip}>
                  <LinearGradient
                    colors={thumbColors}
                    locations={[0, 0.35, 0.72, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.videoThumb}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(0,0,0,0.35)']}
                      locations={[0, 0.45, 1]}
                      style={styles.videoVignette}
                    />
                    <View style={styles.videoFilmLines}>
                      {[0, 1, 2, 3, 4].map(i => (
                        <View key={i} style={[styles.videoFilmLine, { opacity: 0.04 + i * 0.01 }]} />
                      ))}
                    </View>
                    <View style={styles.videoTopBadge}>
                      <MaterialIcons name="videocam" size={14} color={C.accent.primary} />
                    </View>
                    <View style={styles.videoPlayWrap}>
                      <View style={styles.videoPlayRing}>
                        <MaterialIcons name="play-arrow" size={34} color={C.text.onAccent} style={styles.videoPlayIcon} />
                      </View>
                    </View>
                    <View style={styles.videoProgressTrack}>
                      <View style={[styles.videoProgressFill, { width: `${28 + (d.tone % 5) * 12}%` }]} />
                    </View>
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.82)']}
                      style={styles.videoBottomScrim}
                    >
                      <Text style={styles.videoTitle} numberOfLines={1}>
                        {video.title || d.label}
                      </Text>
                      <Text style={styles.videoSub} numberOfLines={1}>
                        Tap to play in app
                      </Text>
                    </LinearGradient>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [playerVisible, setPlayerVisible] = React.useState(false);
  const [activeVideoId, setActiveVideoId] = React.useState(null);
  const [playerError, setPlayerError] = React.useState(false);

  const headerO = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(14)).current;
  const introO = useRef(new Animated.Value(0)).current;
  const introY = useRef(new Animated.Value(16)).current;
  const stripO = useRef(new Animated.Value(0)).current;
  const stripY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.sequence([
      fadeUp(headerO, headerY, 0),
      fadeUp(introO, introY, 0),
      fadeUp(stripO, stripY, 0),
    ]).start();
  }, []);

  const openVideo = (videoId) => {
    if (!videoId) return;
    setActiveVideoId(videoId);
    setPlayerError(false);
    setPlayerVisible(true);
  };

  const closeVideo = () => {
    setPlayerVisible(false);
    setActiveVideoId(null);
    setPlayerError(false);
  };

  const activeVideoTitle =
    HOME_YOUTUBE_VIDEOS.find(v => v.id === activeVideoId)?.title || 'YouTube Video';
  const playerHeight = Math.max(220, Math.round((width * 9) / 16));

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <Animated.View
          style={[
            styles.topBar,
            {
              paddingTop: insets.top + T.spacing.sm,
              opacity: headerO,
              transform: [{ translateY: headerY }],
            },
          ]}
        >
          <View style={styles.brandRow}>
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.5)', 'rgba(94, 234, 212, 0.22)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoMark}
            >
              <MaterialIcons name="auto-awesome" size={26} color={C.accent.primary} />
            </LinearGradient>
            <View style={styles.brandText}>
              <Text style={styles.appName}>{APP_NAME}</Text>
              <Text style={styles.appTagline}>{APP_TAGLINE}</Text>
              <Text style={styles.appSubline}>{HOME_GREETING}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: introO,
            transform: [{ translateY: introY }],
          }}
        >
          <IntroVideoBar onOpenVideo={openVideo} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: stripO,
            transform: [{ translateY: stripY }],
          }}
        >
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Browse categories</Text>
            <Text style={styles.sectionSub}>
              Explore featured topics and tap any preview to watch quickly.
            </Text>
          </View>

          {MENTOR_CATEGORIES.slice(0, HOME_CATEGORY_COUNT).map((categoryTitle, index) => (
            <CategoryRow
              key={categoryTitle}
              categoryTitle={categoryTitle}
              sectionIndex={index}
              onOpenVideo={openVideo}
            />
          ))}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={playerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closeVideo}
      >
        <View style={styles.playerScreen}>
          <View style={[styles.playerHeader, { paddingTop: Math.max(insets.top, T.spacing.md) }]}>
            <View style={styles.playerHeaderTitleWrap}>
              <Text style={styles.playerOverline}>Now Playing</Text>
              <Text style={styles.playerTitle} numberOfLines={1}>{activeVideoTitle}</Text>
            </View>
            <TouchableOpacity onPress={closeVideo} style={styles.playerCloseBtn} activeOpacity={0.8}>
              <MaterialIcons name="close" size={24} color={C.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.playerFrame, { height: playerHeight }]}>
            {activeVideoId ? (
              <YoutubePlayer
                key={activeVideoId}
                height={playerHeight}
                width={width}
                play
                videoId={activeVideoId}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                }}
                onError={() => setPlayerError(true)}
              />
            ) : null}
            {playerError ? (
              <View style={styles.playerErrorWrap}>
                <MaterialIcons name="error-outline" size={22} color={C.accent.error} />
                <Text style={styles.playerErrorText}>Could not render this video.</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.playerMetaArea}>
            <View style={styles.playerMetaRow}>
              <MaterialIcons name="live-tv" size={16} color={C.text.muted} />
              <Text style={styles.playerMetaText}>Embedded playback inside app</Text>
            </View>
            <TouchableOpacity onPress={closeVideo} activeOpacity={0.85} style={styles.playerDoneBtn}>
              <Text style={styles.playerDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingBottom: T.spacing.xxl,
  },
  topBar: {
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border.light,
    ...Platform.select({
      ios: T.shadows.small,
      android: { elevation: 4 },
    }),
  },
  brandText: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  appTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  appSubline: {
    ...T.typography.bodySm,
    color: C.text.muted,
    marginTop: 4,
  },
  sectionHead: {
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.lg,
    marginTop: 2,
  },
  sectionTitle: {
    ...T.typography.headingSm,
    fontSize: 18,
    color: C.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.xs,
  },
  sectionSub: {
    ...T.typography.bodySm,
    color: C.text.muted,
    lineHeight: 20,
  },
  introBlock: {
    marginBottom: T.spacing.xl,
  },
  introHeadRow: {
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: T.spacing.md,
  },
  introHeadLeft: {
    flex: 1,
    minWidth: 0,
  },
  introTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.xs,
    marginBottom: 2,
  },
  introDurationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: T.borderRadius.round,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 4,
    marginTop: 2,
  },
  introDurationText: {
    ...T.typography.labelSm,
    color: C.text.secondary,
    fontWeight: '700',
  },
  introVideoOuter: {
    paddingHorizontal: T.spacing.lg,
  },
  introVideoBorder: {
    borderRadius: T.borderRadius.lg,
    padding: 2,
    ...Platform.select({
      ios: T.shadows.medium,
      android: { elevation: 6 },
    }),
  },
  introVideoClip: {
    borderRadius: T.borderRadius.lg - 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  introVideoThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  introTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  introBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(240, 216, 117, 0.35)',
  },
  introBadgeText: {
    ...T.typography.labelSm,
    fontSize: 10,
    color: C.text.primary,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  introPlayRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(244, 244, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  introPlayIcon: {
    marginLeft: 3,
  },
  introBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 36,
    paddingBottom: 14,
    justifyContent: 'flex-end',
  },
  introVideoTitle: {
    ...T.typography.bodyMd,
    fontSize: 16,
    fontWeight: '800',
    color: '#f4f4ff',
  },
  categorySection: {
    marginBottom: T.spacing.xl + 2,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.md,
    gap: T.spacing.md,
  },
  categoryTitleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border.light,
  },
  categoryTitleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  categoryTitleText: {
    ...T.typography.headingXs,
    fontSize: 17,
    color: C.text.primary,
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'capitalize',
  },
  dummyRow: {
    paddingLeft: T.spacing.lg,
    paddingRight: T.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: T.spacing.xs,
  },
  videoCardOuter: {
    width: VIDEO_TILE_WIDTH + 4,
    marginRight: T.spacing.md,
  },
  videoCardBorder: {
    borderRadius: 16,
    padding: 2,
    ...Platform.select({
      ios: T.shadows.medium,
      android: { elevation: 5 },
    }),
  },
  videoThumbClip: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  videoThumb: {
    width: VIDEO_TILE_WIDTH,
    height: VIDEO_TILE_HEIGHT,
    position: 'relative',
  },
  videoVignette: {
    ...StyleSheet.absoluteFillObject,
  },
  videoFilmLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    pointerEvents: 'none',
  },
  videoFilmLine: {
    height: StyleSheet.hairlineWidth * 2,
    width: '100%',
    backgroundColor: '#ffffff',
  },
  videoTopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(240, 216, 117, 0.35)',
  },
  videoPlayWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(244, 244, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  videoPlayIcon: {
    marginLeft: 4,
  },
  videoProgressTrack: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 52,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  videoBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 36,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  videoTitle: {
    ...T.typography.labelMd,
    fontSize: 12,
    fontWeight: '800',
    color: '#f4f4ff',
  },
  videoSub: {
    ...T.typography.bodyXs,
    fontSize: 10,
    color: 'rgba(244, 244, 255, 0.65)',
    marginTop: 3,
  },
  playerScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  playerHeaderTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: T.spacing.sm,
  },
  playerOverline: {
    ...T.typography.bodyXs,
    color: C.accent.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  playerTitle: {
    ...T.typography.bodyMd,
    color: C.text.primary,
    fontWeight: '700',
  },
  playerCloseBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerFrame: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  playerMetaArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
    paddingBottom: T.spacing.xxl,
    backgroundColor: '#000',
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerMetaText: {
    ...T.typography.bodySm,
    color: C.text.muted,
  },
  playerDoneBtn: {
    alignSelf: 'stretch',
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: T.spacing.md,
    alignItems: 'center',
  },
  playerDoneBtnText: {
    ...T.typography.labelLg,
    color: C.text.primary,
    fontWeight: '700',
  },
  playerErrorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  playerErrorText: {
    ...T.typography.bodySm,
    color: C.text.primary,
  },
});
