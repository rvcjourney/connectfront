import { View, Text, Image, StyleSheet } from 'react-native';
import CosmicBackground from './CosmicBackground';
import { CosmicLoader } from './LoadingSpinner';
import { UNIFIED_THEME } from '../unifiedTheme';

export function SplashScreen() {
  return (
    <CosmicBackground style={styles.bg}>
      <View style={styles.center}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.name}>Connectiqo</Text>
        <View style={styles.spinnerWrap}>
          <CosmicLoader size={48} />
        </View>
      </View>
    </CosmicBackground>
  );
}

const T = UNIFIED_THEME;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: T.spacing.lg,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: T.colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: T.spacing.xxxl,
    textShadowColor: 'rgba(167, 139, 250, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  spinnerWrap: {
    marginTop: T.spacing.sm,
  },
});
