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
  RefreshControl,
  ActivityIndicator,
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
const B = C.buttons;
const TB = C.tabBar;

/** Match mentor profile accent cycle (reserved for future category chips) */
const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const RAIL_CARD_W = 138;
const THUMB_PLACEHOLDER = ['#3d3666', '#16122c'];

function VideoTileCard({ item, onPress }) {
  const thumbH = Math.round(RAIL_CARD_W * 1.35);

  return (
    <TouchableOpacity
      style={[styles.tile, { width: RAIL_CARD_W }]}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${item.label}`}
    >
      <View style={[styles.tileThumb, { height: thumbH }]}>
        {item.thumbnail_url ? (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.tileThumbImg}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={THUMB_PLACEHOLDER}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tileThumbPlaceholder}
          >
            <MaterialIcons name="videocam" size={32} color="rgba(255,255,255,0.38)" />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(3,2,12,0.92)']}
          style={styles.tileThumbFade}
          pointerEvents="none"
        />
        <View style={styles.tilePlayBadge}>
          <MaterialIcons name="play-arrow" size={18} color={C.text.primary} />
        </View>
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileTitle} numberOfLines={2}>
          {item.title || item.label}
        </Text>
        <Text style={styles.tileSub} numberOfLines={1}>
          {item.profiles?.name || 'Featured'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeaderRow({ title, onSeeAll }) {
  return (
    <View style={styles.secHdrRow}>
      <Text style={styles.secHdrTitle}>{title}</Text>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.secHdrLink}>See all &gt;</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const SLIDE_H = 200;
const SLIDE_GAP = T.spacing.md;
const SLIDE_SIDE = T.spacing.lg;
const AUTO_PLAY_MS = 5000;

const FALLBACK_SLIDES = [
  {
    id: 'fallback-1',
    title: 'Expert mentors',
    subtitle: 'Live 1-on-1 video sessions',
    image: require('../../assets/images/logo.png'),
  },
  {
    id: 'fallback-2',
    title: 'Learn & grow',
    subtitle: 'Verified mentors · Secure payments',
    image: require('../../assets/images/logo.png'),
  },
  {
    id: 'fallback-3',
    title: 'Connectiqo',
    subtitle: 'Connect · Learn · Grow',
    image: require('../../assets/images/logo.png'),
  },
];

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
      <SkeletonBox
        style={{
          width: screenWidth - SLIDE_SIDE * 2,
          height: SLIDE_H,
          borderRadius: T.borderRadius.lg,
          marginHorizontal: SLIDE_SIDE,
          marginBottom: T.spacing.md,
        }}
      />
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

function HeroSlide({ slide, slideWidth, isRemote }) {
  const [imgLoading, setImgLoading] = useState(!!slide.image_url);
  const source = slide.image_url ? { uri: slide.image_url } : slide.image;

  return (
    <View style={[styles.heroSlide, { width: slideWidth }]}>
      {isRemote ? (
        <Image
          source={source}
          style={styles.heroSlideImage}
          resizeMode="cover"
          onLoadStart={() => setImgLoading(true)}
          onLoadEnd={() => setImgLoading(false)}
          onError={() => setImgLoading(false)}
        />
      ) : (
        <View style={styles.heroSlideFallbackBg}>
          <Image source={source} style={styles.heroSlideLogo} resizeMode="contain" />
        </View>
      )}

      {imgLoading ? (
        <View style={styles.heroSlideLoader}>
          <ActivityIndicator size="small" color={C.accent.secondary} />
        </View>
      ) : null}

      <LinearGradient
        colors={['transparent', 'rgba(3,3,8,0.55)', 'rgba(3,3,8,0.92)']}
        locations={[0.35, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {(slide.title || slide.subtitle) ? (
        <View style={styles.heroSlideCaption} pointerEvents="none">
          {slide.title ? (
            <Text style={styles.heroSlideTitle} numberOfLines={1}>{slide.title}</Text>
          ) : null}
          {slide.subtitle ? (
            <Text style={styles.heroSlideSub} numberOfLines={2}>{slide.subtitle}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function HeroPagination({ count, activeIndex, onSelect }) {
  if (count <= 1) return null;
  return (
    <View style={styles.heroDots} accessibilityRole="tablist">
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(i)}
            style={styles.heroDotHit}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Banner ${i + 1} of ${count}`}
          >
            {active ? (
              <LinearGradient
                colors={TB.topNavActiveWash}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroDotActive}
              />
            ) : (
              <View style={styles.heroDot} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HeroSlider({ screenWidth, slides }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const userDragging = useRef(false);
  const autoTimer = useRef(null);

  const slideWidth = screenWidth - SLIDE_SIDE * 2;
  const snapInterval = slideWidth + SLIDE_GAP;

  const scrollToIndex = useCallback((index, animated = true) => {
    const safe = Math.max(0, Math.min(index, slides.length - 1));
    listRef.current?.scrollToOffset({
      offset: safe * snapInterval,
      animated,
    });
    setActiveIndex(safe);
  }, [slides.length, snapInterval]);

  const clearAutoPlay = useCallback(() => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAutoPlay();
    if (slides.length <= 1) return;
    autoTimer.current = setInterval(() => {
      if (userDragging.current) return;
      setActiveIndex(prev => {
        const next = (prev + 1) % slides.length;
        listRef.current?.scrollToOffset({
          offset: next * snapInterval,
          animated: true,
        });
        return next;
      });
    }, AUTO_PLAY_MS);
  }, [clearAutoPlay, slides.length, snapInterval]);

  useEffect(() => {
    startAutoPlay();
    return clearAutoPlay;
  }, [startAutoPlay, clearAutoPlay]);

  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [slides.length, snapInterval]);

  if (!slides.length) return null;

  return (
    <View style={styles.heroSliderWrap}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={s => String(s.id)}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        bounces={slides.length > 1}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: SLIDE_SIDE,
          gap: SLIDE_GAP,
        }}
        getItemLayout={(_, i) => ({
          length: snapInterval,
          offset: snapInterval * i,
          index: i,
        })}
        onScrollBeginDrag={() => {
          userDragging.current = true;
          clearAutoPlay();
        }}
        onScrollEndDrag={() => {
          userDragging.current = false;
          startAutoPlay();
        }}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
          setActiveIndex(Math.max(0, Math.min(i, slides.length - 1)));
        }}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => scrollToIndex(index, false), 50);
        }}
        renderItem={({ item }) => (
          <HeroSlide
            slide={item}
            slideWidth={slideWidth}
            isRemote={!!item.image_url}
          />
        )}
      />
      <HeroPagination
        count={slides.length}
        activeIndex={activeIndex}
        onSelect={scrollToIndex}
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
  const { width, height } = useWindowDimensions();
  const [playerVisible, setPlayerVisible] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [urlPlayback, setUrlPlayback] = useState(null);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadHome = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
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
        const merged = [...sessions, ...freeVideos]
          .filter(v => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSessionVideos(merged.slice(0, 10));
      }
      if (slidesResult.status === 'fulfilled' && slidesResult.value.length > 0) {
        setHeroSlides(slidesResult.value);
      }
      setDataLoaded(true);
      setRefreshing(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { loadHome(false); }, [loadHome]));

  return (
    <SafeScreen scrollable={false} padding={0} hasBottomTabs={false}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          {
            paddingTop: insets.top + T.spacing.lg,
            paddingBottom:
              insets.bottom + (TB.floating?.contentReserve ?? 78) + T.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHome(true)}
            tintColor={C.accent.primary}
            colors={[C.accent.primary]}
          />
        }
      >

        {/* ── APP BAR ── */}
        <Animated.View style={[styles.appBar, s0.style]}>
          <LinearGradient colors={B.premiumGradient} style={styles.logoRing}>
            <View style={styles.logoTile}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logoMark}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
          <View style={styles.appBarTitles}>
            <Text style={styles.appName} numberOfLines={1}>
              Connectiqo
            </Text>
            <Text style={styles.appTagline} numberOfLines={1}>
              Connect · Learn · Grow
            </Text>
          </View>
          <TouchableOpacity
            style={styles.appBarBtn}
            onPress={() => navigation.navigate(SCREEN_NAMES.UnifiedSettings)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <MaterialIcons name="bolt" size={22} color={C.text.primary} />
          </TouchableOpacity>
        </Animated.View>

        {!dataLoaded ? <HomeSkeleton screenWidth={width} /> : (
        <>
        {/* ── HERO SLIDER ── */}
        <Animated.View style={[s1.style, styles.heroSection]}>
          <HeroSlider screenWidth={width} slides={heroSlides} />
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
            <View style={styles.videoCardInner}>
              <View style={styles.videoPlayBtn}>
                <LinearGradient
                  colors={B.nebulaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.videoPlayGrad}
                >
                  <MaterialIcons name="play-arrow" size={28} color={B.nebulaText} style={{ marginLeft: 3 }} />
                </LinearGradient>
              </View>
              <View style={styles.videoCardText}>
                <Text style={styles.videoCardTitle} numberOfLines={1}>
                  {introVideo.title}
                </Text>
                <Text style={styles.videoCardLabel} numberOfLines={1}>
                  {introVideo.label}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={PURPLE_LINK} />
            </View>
          </TouchableOpacity>
        </Animated.View>
        )}

        {/* ── VIDEO CATEGORIES ── */}
        {sessionVideos.length > 0 && (
        <Animated.View style={[styles.catSection, s2b.style]}>
          <SectionHeaderRow
            title="Recent Sessions"
            onSeeAll={() =>
              navigation.navigate(SCREEN_NAMES.LearnerSection, {
                screen: SCREEN_NAMES.LearnerVideos,
                params: { filterMentorId: null },
              })
            }
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tileRow}
          >
            {sessionVideos.map(item => (
              <VideoTileCard
                key={item.id}
                item={item}
                onPress={cat => {
                  navigation.navigate(SCREEN_NAMES.LearnerSection, {
                    screen: SCREEN_NAMES.LearnerVideos,
                    params: { startVideoId: cat.id, filterMentorId: null },
                  });
                }}
              />
            ))}
          </ScrollView>
        </Animated.View>
        )}


        {/* ── TRUST STRIP ── */}
        <Animated.View style={[styles.trustStrip, s5.style]}>
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
            <MaterialIcons name="close" size={20} color={C.text.primary} />
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
  },

  // App bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: T.spacing.lg,
    marginBottom: T.spacing.md,
    gap: T.spacing.md,
  },
  logoRing: {
    padding: 2,
    borderRadius: T.borderRadius.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({ ios: T.shadows.small, android: { elevation: 4 } }),
  },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: T.borderRadius.md,
    backgroundColor: C.primary.void,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoMark: {
    width: 30,
    height: 30,
  },
  appBarTitles: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  appName: {
    ...T.typography.headingSm,
    color: C.text.primary,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  appTagline: {
    ...T.typography.bodyXs,
    color: PURPLE_LINK,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  appBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12,12,40,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  heroSection: {
    marginBottom: T.spacing.sm,
  },
  heroSliderWrap: {
    marginBottom: T.spacing.xs,
  },
  heroSlide: {
    height: SLIDE_H,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: C.primary.dark,
    ...Platform.select({ ios: T.shadows.medium, android: { elevation: 8 } }),
  },
  heroSlideImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroSlideFallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.primary.nebula,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSlideLogo: {
    width: 72,
    height: 72,
    opacity: 0.9,
  },
  heroSlideLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(1,0,14,0.35)',
  },
  heroSlideCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: T.spacing.md,
    paddingBottom: T.spacing.md,
    paddingTop: T.spacing.xl,
  },
  heroSlideTitle: {
    ...T.typography.headingSm,
    color: C.text.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSlideSub: {
    ...T.typography.bodySm,
    color: C.text.secondary,
    lineHeight: 18,
  },
  heroDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: T.spacing.md,
    paddingHorizontal: SLIDE_SIDE,
  },
  heroDotHit: {
    padding: 4,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroDotActive: {
    width: 22,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },

  secHdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: T.spacing.xs,
    marginBottom: 2,
  },
  secHdrTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text.primary,
  },
  secHdrLink: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE_LINK,
  },

  // Video categories
  catSection: {
    marginBottom: T.spacing.xl,
  },
  tileRow: {
    gap: 10,
    paddingRight: T.spacing.xs,
    paddingTop: 6,
    paddingBottom: T.spacing.sm,
  },
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  tileThumb: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  tileThumbImg: {
    ...StyleSheet.absoluteFillObject,
  },
  tileThumbPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileThumbFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '35%',
  },
  tilePlayBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileBody: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tileTitle: {
    color: C.text.primary,
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 3,
  },
  tileSub: {
    fontSize: 10,
    color: C.text.muted,
    fontWeight: '600',
  },

  // Trust strip (mentor profile stats bar pattern)
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 11,
    paddingHorizontal: 4,
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginVertical: 6,
    alignSelf: 'stretch',
  },

  // Video card
  videoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: T.spacing.lg,
    ...Platform.select({ ios: T.shadows.small, android: { elevation: 3 } }),
  },
  videoCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    padding: T.spacing.md,
  },
  videoPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    // borderWidth: 1,
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
    justifyContent: 'center',
  },
  videoCardTitle: {
    ...T.typography.labelMd,
    color: C.text.primary,
    fontWeight: '800',
  },
  videoCardLabel: {
    marginTop: 2,
    color: GOLD,
    fontWeight: '700',
    fontSize: 12,
  },
  // Player modal
  playerScreen: {
    flex: 1,
    backgroundColor: C.primary.void,
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
