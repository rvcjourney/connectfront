import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { UNIFIED_THEME } from '../unifiedTheme';

function buildStarField(count) {
  let seed = 62831;
  const next = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 0xffffffff;
  };
  const stars = [];
  for (let i = 0; i < count; i++) {
    const roll = next();
    const size = roll > 0.88 ? 2.5 : roll > 0.55 ? 1.5 : 1;
    stars.push({
      key: i,
      left: `${next() * 100}%`,
      top: `${next() * 100}%`,
      width: size,
      height: size,
      borderRadius: size / 2,
      opacity: 0.12 + next() * 0.78,
    });
  }
  return stars;
}

const STARS = buildStarField(96);

/**
 * Full-screen deep space: galaxy gradient, nebula haze, star field.
 */
export default function CosmicBackground({ children, style }) {
  const { primary, cosmic } = UNIFIED_THEME.colors;

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={primary.gradient}
        locations={cosmic.mainGradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={cosmic.nebulaHaze}
        locations={cosmic.nebulaLocations}
        start={{ x: 0.15, y: 1 }}
        end={{ x: 0.85, y: 0 }}
        style={[StyleSheet.absoluteFill, styles.haze]}
        pointerEvents="none"
      />
      <View style={styles.starLayer} pointerEvents="none">
        {STARS.map((s) => (
          <View
            key={s.key}
            style={[
              styles.star,
              {
                left: s.left,
                top: s.top,
                width: s.width,
                height: s.height,
                borderRadius: s.borderRadius,
                opacity: s.opacity,
              },
            ]}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.void,
  },
  haze: {
    opacity: UNIFIED_THEME.colors.cosmic.hazeOpacity,
  },
  starLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
