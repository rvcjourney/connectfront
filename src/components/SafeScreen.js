import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UNIFIED_THEME } from '../unifiedTheme';

/**
 * SafeScreen - Uses react-native-safe-area-context for better safe area handling
 * Ensures all screens fit safely on any mobile device with notches, bottom bars, tabs, etc.
 */
export const SafeScreen = ({
  children,
  scrollable = true,
  backgroundColor = UNIFIED_THEME.colors.primary.light,
  padding = UNIFIED_THEME.spacing.lg,
  hasBottomTabs = true, // Add extra space for bottom tab navigator
  refreshControl,
}) => {
  const insets = useSafeAreaInsets();

  // Tab bar height (~70px) - add extra space if inside tab navigator
  const bottomTabHeight = hasBottomTabs ? 70 : 0;

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: padding + insets.top,
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
    <View style={[styles.safeArea, { backgroundColor }]}>
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={refreshControl}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
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
