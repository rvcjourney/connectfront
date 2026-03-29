import { View, StyleSheet } from "react-native";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { UNIFIED_THEME } from "../../../unifiedTheme";

/**
 * Waiting room view - shown while joining the meeting
 */
export default function WaitingToJoinView() {
  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={true}
        message="Creating a room"
        backdropOpacity={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
});
