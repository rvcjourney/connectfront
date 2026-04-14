import { View, Text, StyleSheet, Modal } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CosmicLoader } from './LoadingSpinner';
import { UNIFIED_THEME } from '../unifiedTheme';

/**
 * Full-screen loading overlay — cosmic glass card + orbit loader.
 */
export const LoadingOverlay = ({
  visible = false,
  message = 'Loading...',
  backdropOpacity = 0.75,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.root}>
        <View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="none"
        />
        <View style={styles.center}>
          <LinearGradient
            colors={[
              'rgba(26, 16, 48, 0.95)',
              'rgba(12, 12, 40, 0.98)',
              'rgba(8, 32, 52, 0.92)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardInnerBorder} />
            <CosmicLoader size={56} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Please wait</Text>
            </View>
            <Text style={styles.message}>{message}</Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: UNIFIED_THEME.colors.primary.void,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
  },
  card: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xxl,
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    borderRadius: UNIFIED_THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    minWidth: 220,
    maxWidth: 280,
    overflow: 'hidden',
    ...UNIFIED_THEME.shadows.large,
  },
  cardInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: UNIFIED_THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.12)',
    margin: 1,
    pointerEvents: 'none',
  },
  message: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: UNIFIED_THEME.spacing.md,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  badge: {
    marginTop: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeText: {
    ...UNIFIED_THEME.typography.labelSm,
    color: UNIFIED_THEME.colors.text.muted,
    fontWeight: '700',
  },
});
