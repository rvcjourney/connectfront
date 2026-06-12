import { View, Text, StyleSheet } from 'react-native';
import { CosmicLoader } from './LoadingSpinner';
import { UNIFIED_THEME } from '../unifiedTheme';

/**
 * In-screen overlay (not a Modal) so preloaded tab screens cannot block the whole app.
 */
export const LoadingOverlay = ({
  visible = false,
  message = 'Loading...',
  backdropOpacity = 0.75,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="none"
      />
      <View style={styles.center} pointerEvents="none">
        <CosmicLoader size={56} />
        {message ? (
          <Text style={styles.message}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: UNIFIED_THEME.colors.primary.void,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: UNIFIED_THEME.spacing.md,
    letterSpacing: 0.2,
  },
});
