import { View, Text, StyleSheet, Modal } from 'react-native';
import { CosmicLoader } from './LoadingSpinner';
import { UNIFIED_THEME } from '../unifiedTheme';

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
          <CosmicLoader size={56} />
          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}
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
  },
  message: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: UNIFIED_THEME.spacing.md,
    letterSpacing: 0.2,
  },
});
