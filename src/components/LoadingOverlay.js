import { View, Text, StyleSheet, Modal } from "react-native";
import { PulsingDots } from "./LoadingSpinner";
import { UNIFIED_THEME } from "../unifiedTheme";

/**
 * Full-screen loading overlay with message
 * Uses bouncing pink dots animation
 */
export const LoadingOverlay = ({
  visible = false,
  message = "Loading...",
  backdropOpacity = 0.7,
}) => {

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <View style={styles.container}>
        <View style={styles.content}>
          <PulsingDots size={18} color="primary" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: UNIFIED_THEME.colors.component.overlay,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingVertical: UNIFIED_THEME.spacing.xxxl,
    paddingHorizontal: UNIFIED_THEME.spacing.xxl,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    gap: UNIFIED_THEME.spacing.lg,
    ...UNIFIED_THEME.shadows.large,
  },
  message: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: "center",
    marginTop: UNIFIED_THEME.spacing.md,
  },
});
