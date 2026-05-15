import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UNIFIED_THEME } from '../unifiedTheme';
import CosmicBackground from './CosmicBackground';

/**
 * SafeScreen - Uses react-native-safe-area-context for better safe area handling
 * Ensures all screens fit safely on any mobile device with notches, bottom bars, tabs, etc.
 */
export const SafeScreen = ({
  children,
  scrollable = true,
  backgroundColor = 'transparent',
  padding = UNIFIED_THEME.spacing.lg,
  hasBottomTabs = true, // Add extra space for bottom tab navigator
  /** When false, top inset is omitted (e.g. material top tab bar already clears status bar). */
  includeTopInset = true,
  refreshControl,
}) => {
  const insets = useSafeAreaInsets();

  // Floating bottom tab bar (~88px) + safe area handled in tab bar shell
  const bottomTabHeight = hasBottomTabs ? 88 : 0;
  const topPad = padding + (includeTopInset ? insets.top : 0);

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: topPad,
          paddingBottom: padding + insets.bottom + bottomTabHeight,
          paddingLeft: padding + insets.left,
          paddingRight: padding + insets.right,
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <CosmicBackground style={styles.safeArea}>
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          refreshControl={refreshControl}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </CosmicBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});
