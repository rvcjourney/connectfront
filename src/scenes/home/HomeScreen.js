import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { homeApi } from '../../api/homeApi';
import { videoApi } from '../../api/videoApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const T = UNIFIED_THEME;
const C = T.colors;
const TB = C.tabBar;

const STEPS = [
  {
    icon: 'search',
    title: 'Browse Mentors',
    desc: 'Filter by skill, rating, or hourly rate to find the right expert.',
    color: C.accent.primary,
    bg: 'rgba(240,216,117,0.1)',
    border: 'rgba(240,216,117,0.25)',
  },
  {
    icon: 'event-available',
    title: 'Book a Slot',
    desc: 'Pick a time that works. Secure checkout with instant confirmation.',
    color: C.accent.secondary,
    bg: 'rgba(94,234,212,0.1)',
    border: 'rgba(94,234,212,0.25)',
  },
  {
    icon: 'videocam',
    title: 'Join Live Session',
    desc: 'Connect face-to-face via HD video. Real mentorship, in real time.',
    color: 'rgba(167,139,250,1)',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.25)',
  },
];

// Accent colours cycle across session tiles (DB has no accent column)
const TILE_ACCENTS = ['#a78bfa', '#5eead4', '#f0d875', '#f9a8d4'];

function VideoTileCard({ item, accent, onPress }) {
  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${item.label}`}
    >
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[`${accent}33`, C.primary.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Dark scrim */}
      <LinearGradient
        colors={['rgba(2,0,20,0.18)', 'rgba(2,0,20,0.45)', 'rgba(2,0,20,0.88)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Accent tint */}
      <LinearGradient
        colors={[`${accent}30`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Category icon badge */}
      <View style={[styles.tileBadge, { backgroundColor: `${accent}33`, borderColor: `${accent}66` }]}>
        <MaterialIcons name="play-circle-filled" size={13} color={accent} />
      </View>

      {/* Centered play button */}
      <View style={styles.tilePlayWrap}>
        <View style={styles.tilePlayBtn}>
          <MaterialIcons name="play-arrow" size={26} color="#fff" style={{ marginLeft: 3 }} />
        </View>
      </View>

      {/* Bottom label */}
      <View style={styles.tileBottom}>
        <Text style={styles.tileTitle} numberOfLines={2}>{item.title || item.label}</Text>
        <Text style={[styles.tileSub, { color: `${accent}cc` }]} numberOfLines={1}>
          {item.profiles?.name || 'Free video'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Hero slider ─────────────────────────────────────────────────────────────
const SLIDE_H = 275;

const FALLBACK_SLIDES = [];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function useShimmer() {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return anim;
}

function SkeletonBox({ style }) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }, style, { opacity }]}
    />
  );
}

function HomeSkeleton({ screenWidth }) {
  return (
    <>
      <SkeletonBox style={{ width: screenWidth, height: SLIDE_H, borderRadius: 0 }} />
      <View style={{ paddingHorizontal: T.spacing.lg }}>
        <SkeletonBox style={{ height: 70, borderRadius: 14, marginTop: T.spacing.lg, marginBottom: T.spacing.lg }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.spacing.md }}>
          <SkeletonBox style={{ width: 130, height: 14, borderRadius: 6 }} />
          <SkeletonBox style={{ width: 44, height: 12, borderRadius: 6 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: T.spacing.md }}>
          {[0, 1, 2].map(i => (
            <SkeletonBox key={i} style={{ width: 148, height: 186, borderRadius: T.borderRadius.lg }} />
          ))}
        </View>
      </View>
    </>
  );
}

function HeroSlide({ slide, slideWidth }) {
  const source = slide.image_url
    ? { uri: slide.image_url }
    : slide.image;
  return (
    <View style={{ width: slideWidth, height: SLIDE_H, overflow: 'hidden' }}>
      <Image
        source={source}
        style={{ width: slideWidth, height: SLIDE_H }}
        resizeMode="contain"
      />
    </View>
  );
}

function HeroSlider({ slideWidth, slides }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (!slides.length) return;
    const timer = setInterval(() => {
      setSlideIndex(prev => {
        const next = (prev + 1) % slides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={s => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: slideWidth, offset: slideWidth * i, index: i })}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
          setSlideIndex(i);
        }}
        renderItem={({ item }) => (
          <HeroSlide slide={item} slideWidth={slideWidth} />
        )}
      />
    </View>
  );
}



const TRUST = [
  { icon: 'verified-user', label: 'Verified Mentors' },
  { icon: 'lock', label: 'Secure Payments' },
  { icon: 'videocam', label: 'Live HD Video' },
  { icon: 'star', label: 'Rated & Reviewed' },
];

const DURATION = 420;
const EASE = Easing.out(Easing.cubic);

function anim(opacity, translateY, delay = 0) {
  return Animated.parallel([
    Animated.timing(opacity, { toValue: 1, delay, duration: DURATION, easing: EASE, useNativeDriver: true }),
    Animated.timing(translateY, { toValue: 0, delay, duration: DURATION, easing: EASE, useNativeDriver: true }),
  ]);
}

function useEntrance() {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(18)).current;
  return { o, y, style: { opacity: o, transform: [{ translateY: y }] } };
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [playerVisible, setPlayerVisible] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [urlPlayback, setUrlPlayback] = useState(null);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [heroSlides, setHeroSlides] = useState(FALLBACK_SLIDES);
  const [introVideo, setIntroVideo] = useState(null);
  const [sessionVideos, setSessionVideos] = useState([]);

  const s0 = useEntrance(); // app bar
  const s1 = useEntrance(); // hero
  const s2 = useEntrance(); // video card
  const s2b = useEntrance(); // video categories
  const s3 = useEntrance(); // dual role
  const s4 = useEntrance(); // how it works
  const s5 = useEntrance(); // trust strip

  useEffect(() => {
    Animated.stagger(80, [
      anim(s0.o, s0.y),
      anim(s1.o, s1.y),
      anim(s2.o, s2.y),
      anim(s2b.o, s2b.y),
      anim(s3.o, s3.y),
      anim(s4.o, s4.y),
      anim(s5.o, s5.y),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      Promise.allSettled([
        homeApi.getVideos(),
        videoApi.getFreeVideos(),
        homeApi.getHeroSlides(),
      ]).then(([homeResult, freeResult, slidesResult]) => {
        const sessions = homeResult.status === 'fulfilled' ? homeResult.value.sessions : [];
        const freeVideos = freeResult.status === 'fulfilled' ? freeResult.value : [];
        if (homeResult.status === 'fulfilled' && homeResult.value.intro) {
          setIntroVideo(homeResult.value.intro);
        }
        if (sessions.length || freeVideos.length) {
          const seen = new Set();
          const merged = [...sessions, ...freeVideos].filter(v => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
          setSessionVideos(merged);
        }
        if (slidesResult.status === 'fulfilled' && slidesResult.value.length > 0) {
          setHeroSlides(slidesResult.value);
        }
        setDataLoaded(true);
      });
    }, [])
  );

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingTop: insets.top + T.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── APP BAR ── */}
        <Animated.View style={[styles.appBar, s0.style, { paddingHorizontal: T.spacing.lg }]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>Connectiqo</Text>
            <Text style={styles.appTagline}>Connect · Learn · Grow</Text>
          </View>
          <TouchableOpacity
            style={styles.appBarBtn}
            onPress={() => navigation.navigate(SCREEN_NAMES.UnifiedSettings)}
            activeOpacity={0.75}
          >
            <MaterialIcons name="notifications-none" size={22} color={C.text.secondary} />
          </TouchableOpacity>
        </Animated.View>

        {!dataLoaded ? <HomeSkeleton screenWidth={width} /> : (
        <>
        {/* ── HERO SLIDER — no horizontal padding, true full width ── */}
        <Animated.View style={[s1.style]}>
          <HeroSlider slideWidth={width} slides={heroSlides} />
        </Animated.View>

        {/* ── padded wrapper for all content below the slider ── */}
        <View style={{ paddingHorizontal: T.spacing.lg }}>
        {/* ── WATCH HOW IT WORKS ── */}
        {introVideo && (
        <Animated.View style={s2.style}>
          <TouchableOpacity
            style={styles.videoCard}
            activeOpacity={0.88}
            onPress={() => {
              setUrlPlayback(introVideo.video_url);
              setPlayerError(false);
              setPlayerVisible(true);
            }}
          >
            <LinearGradient
              colors={['rgba(167,139,250,0.22)', 'rgba(94,234,212,0.1)', 'rgba(2,0,20,0.6)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={TB.flatBarEdge}
              locations={[0, 0.35, 0.65, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.videoCardBeam}
              pointerEvents="none"
            />
            <View style={styles.videoCardInner}>
              <View style={styles.videoPlayBtn}>
                <LinearGradient
                  colors={[C.accent.primary, C.accent.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.videoPlayGrad}
                >
                  <MaterialIcons name="play-arrow" size={28} color={C.text.onAccent} style={{ marginLeft: 3 }} />
                </LinearGradient>
              </View>
              <View style={styles.videoCardText}>
                <Text style={styles.videoCardLabel}>WATCH</Text>
                <Text style={styles.videoCardTitle}>{introVideo.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={C.text.muted} />
            </View>
          </TouchableOpacity>
        </Animated.View>
        )}

        {/* ── VIDEO CATEGORIES ── */}
        {sessionVideos.length > 0 && (
        <Animated.View style={[styles.catSection, s2b.style]}>
          <View style={styles.catHeader}>
            <View style={styles.catHeaderLeft}>
              <View style={[styles.sectionDot, { backgroundColor: C.accent.primary }]} />
              <Text style={styles.sectionLabel}>Recent Sessions</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate(SCREEN_NAMES.LearnerSection, { screen: SCREEN_NAMES.LearnerVideos })} activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tileRow}
          >
            {sessionVideos.map((item, index) => (
              <VideoTileCard
                key={item.id}
                item={item}
                accent={TILE_ACCENTS[index % TILE_ACCENTS.length]}
                onPress={cat => {
                  navigation.navigate(SCREEN_NAMES.LearnerSection, {
                    screen: SCREEN_NAMES.LearnerVideos,
                    params: { startVideoId: cat.id },
                  });
                }}
              />
            ))}
          </ScrollView>
        </Animated.View>
        )}


        {/* ── DUAL ROLE CARDS ── */}
        <Animated.View style={[styles.dualRow, s3.style]}>
          {/* Learner card */}
          <TouchableOpacity style={[styles.roleCard, styles.roleCardLeft]} onPress={() => navigation.navigate(SCREEN_NAMES.LearnerSection)} activeOpacity={0.82}>
            <LinearGradient
              colors={['rgba(94,234,212,0.14)', 'rgba(94,234,212,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(94,234,212,0.14)', borderColor: 'rgba(94,234,212,0.3)' }]}>
              <MaterialIcons name="school" size={24} color={C.accent.secondary} />
            </View>
            <Text style={styles.roleTitle}>As a Learner</Text>
            <Text style={styles.roleDesc}>Browse mentors, book sessions, and level up your skills 1-on-1.</Text>
            <View style={styles.roleFeatures}>
              {['Search by skill', 'Pay per session', 'Live video call'].map(f => (
                <View key={f} style={styles.roleFeatureRow}>
                  <MaterialIcons name="check-circle" size={12} color={C.accent.secondary} />
                  <Text style={styles.roleFeatureText}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Mentor card */}
          <TouchableOpacity style={[styles.roleCard, styles.roleCardRight]} onPress={() => navigation.navigate(SCREEN_NAMES.MentorSection)} activeOpacity={0.82}>
            <LinearGradient
              colors={['rgba(240,216,117,0.14)', 'rgba(240,216,117,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(240,216,117,0.14)', borderColor: 'rgba(240,216,117,0.3)' }]}>
              <MaterialIcons name="workspace-premium" size={24} color={C.accent.primary} />
            </View>
            <Text style={styles.roleTitle}>As a Mentor</Text>
            <Text style={styles.roleDesc}>Set your rate, manage availability, and earn by teaching what you love.</Text>
            <View style={styles.roleFeatures}>
              {['Set hourly rate', 'Manage schedule', 'Track earnings'].map(f => (
                <View key={f} style={styles.roleFeatureRow}>
                  <MaterialIcons name="check-circle" size={12} color={C.accent.primary} />
                  <Text style={styles.roleFeatureText}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── HOW IT WORKS ── */}
        <Animated.View style={[styles.section, s4.style]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionDot, { backgroundColor: C.accent.secondary }]} />
            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          </View>
          <Text style={styles.sectionTitle}>From discovery to live session in minutes</Text>

          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepIconBox, { backgroundColor: step.bg, borderColor: step.border }]}>
                  <MaterialIcons name={step.icon} size={22} color={step.color} />
                </View>
                {i < STEPS.length - 1 ? <View style={styles.stepConnector} /> : null}
              </View>
              <View style={styles.stepBody}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepNum}>0{i + 1}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── TRUST STRIP ── */}
        <Animated.View style={[styles.trustStrip, s5.style]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {TRUST.map((t, i) => (
            <React.Fragment key={t.label}>
              <View style={styles.trustItem}>
                <MaterialIcons name={t.icon} size={20} color={i % 2 === 0 ? C.accent.primary : C.accent.secondary} />
                <Text style={styles.trustLabel}>{t.label}</Text>
              </View>
              {i < TRUST.length - 1 ? <View style={styles.trustDivider} /> : null}
            </React.Fragment>
          ))}
        </Animated.View>

        </View>{/* end padded wrapper */}
        </>
        )}{/* end dataLoaded conditional */}

      </ScrollView>

      {/* ── VIDEO PLAYER MODAL ── */}
      <Modal
        visible={playerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setPlayerVisible(false);
          setUrlPlayback(null);
        }}
      >
        <View style={styles.playerScreen}>
          {playerVisible && urlPlayback ? (
            <Video
              source={{ uri: urlPlayback }}
              style={{ width, height }}
              controls
              resizeMode="contain"
              onError={() => setPlayerError(true)}
            />
          ) : null}
          {/* Close button overlay */}
          <TouchableOpacity
            style={[styles.playerCloseOverlay, { top: insets.top + 10 }]}
            onPress={() => {
              setPlayerVisible(false);
              setUrlPlayback(null);
            }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          {playerError ? (
            <View style={styles.playerError}>
              <MaterialIcons name="error-outline" size={22} color={C.accent.error} />
              <Text style={styles.playerErrorText}>Could not load video.</Text>
            </View>
          ) : null}
        </View>
      </Modal>


    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingBottom: T.spacing.xxxl + 16,
  },

  // App bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    marginBottom: T.spacing.xl,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text.primary,
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: C.accent.secondary,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  appBarBtn: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.component.card,
    borderWidth: 1, borderColor: C.border.light,
  },
  seeAll: {
    fontSize: 12, fontWeight: '700',
    color: C.accent.secondary,
    letterSpacing: 0.2,
  },

  // Video categories
  catSection: {
    marginBottom: T.spacing.xl,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.md,
  },
  catHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catSubtitle: {
    ...T.typography.labelSm,
    color: C.text.muted,
    fontSize: 11,
  },
  tileRow: {
    gap: T.spacing.md,
    paddingRight: T.spacing.xs,
  },
  tile: {
    width: 148,
    height: 186,
    borderRadius: T.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.primary.dark,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  tileBadge: {
    position: 'absolute',
    top: T.spacing.sm,
    left: T.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    zIndex: 2,
  },
  tilePlayWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
  },
  tilePlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileBottom: {
    padding: T.spacing.sm,
    paddingBottom: T.spacing.md,
  },
  tileTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 3,
  },
  tileSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.42)',
    fontWeight: '500',
  },

  // Dual role
  dualRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.xl,
  },
  roleCard: {
    flex: 1,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    padding: T.spacing.md,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({ ios: T.shadows.small, android: { elevation: 3 } }),
  },
  roleCardLeft: {
    borderColor: 'rgba(94,234,212,0.28)',
    backgroundColor: C.primary.dark,
    borderTopWidth: 2,
    borderTopColor: 'rgba(94,234,212,0.6)',
  },
  roleCardRight: {
    borderColor: 'rgba(240,216,117,0.28)',
    backgroundColor: C.primary.dark,
    borderTopWidth: 2,
    borderTopColor: 'rgba(240,216,117,0.6)',
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: T.spacing.sm,
  },
  roleTitle: {
    ...T.typography.labelMd,
    color: C.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.xs,
  },
  roleDesc: {
    ...T.typography.bodyXs,
    color: C.text.muted,
    lineHeight: 15,
    marginBottom: T.spacing.md,
  },
  roleFeatures: {
    gap: 5,
  },
  roleFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roleFeatureText: {
    ...T.typography.bodyXs,
    color: C.text.secondary,
    fontSize: 11,
  },

  // How it works
  section: {
    marginBottom: T.spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text.muted,
    letterSpacing: 1.4,
  },
  sectionTitle: {
    ...T.typography.headingSm,
    color: C.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: T.spacing.md,
    marginBottom: 2,
  },
  stepLeft: {
    alignItems: 'center',
    width: 44,
  },
  stepIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: C.border.light,
    borderRadius: 1,
    opacity: 0.5,
    marginVertical: 4,
  },
  stepBody: {
    flex: 1,
    paddingBottom: T.spacing.lg,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    marginBottom: 5,
    marginTop: T.spacing.sm,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '900',
    color: C.text.muted,
    letterSpacing: 0.5,
  },
  stepTitle: {
    ...T.typography.labelMd,
    color: C.text.primary,
    fontWeight: '800',
  },
  stepDesc: {
    ...T.typography.bodySm,
    color: C.text.muted,
    lineHeight: 20,
  },

  // Trust strip
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.component.card,
    overflow: 'hidden',
    paddingVertical: T.spacing.md,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  trustLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.text.muted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  trustDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.border.light,
    opacity: 0.5,
  },

  // Video card
  videoCard: {
    borderRadius: T.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border.light,
    backgroundColor: C.primary.dark,
    marginBottom: T.spacing.lg,
    position: 'relative',
    ...Platform.select({ ios: T.shadows.small, android: { elevation: 4 } }),
  },
  videoCardBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    opacity: 0.85,
  },
  videoCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    padding: T.spacing.lg,
  },
  videoPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border.light,
    ...Platform.select({
      ios: { shadowColor: C.accent.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 6 },
      android: { elevation: 5 },
    }),
  },
  videoPlayGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCardText: {
    flex: 1,
    minWidth: 0,
  },
  videoCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.text.muted,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  videoCardTitle: {
    ...T.typography.labelMd,
    color: C.text.primary,
    fontWeight: '800',
    marginBottom: 5,
  },
  // Player modal
  playerScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  playerCloseOverlay: {
    position: 'absolute',
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playerError: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  playerErrorText: {
    ...T.typography.bodySm,
    color: C.text.primary,
  },
});
