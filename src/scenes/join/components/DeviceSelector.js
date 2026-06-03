import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import Modal from "react-native-modal";
import { UNIFIED_THEME } from "../../../unifiedTheme";

export const DeviceSelector = ({
  isVisible,
  audioList,
  selectedDeviceId,
  onDeviceSelect,
  onClose,
}) => {
  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.deviceButton,
        item.deviceId === selectedDeviceId && styles.selectedDeviceButton,
      ]}
      onPress={() => onDeviceSelect(item)}
    >
      <Text style={styles.deviceText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Available Audio Devices</Text>
        <FlatList
          data={audioList}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.deviceId}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    padding: UNIFIED_THEME.spacing.xxl,
    borderTopLeftRadius: UNIFIED_THEME.borderRadius.xl,
    borderTopRightRadius: UNIFIED_THEME.borderRadius.xl,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    maxHeight: "80%",
  },
  modalTitle: {
    ...UNIFIED_THEME.typography.headingSm,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  deviceButton: {
    paddingVertical: UNIFIED_THEME.spacing.lg,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    marginBottom: UNIFIED_THEME.spacing.md,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  deviceText: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.primary,
  },
  selectedDeviceButton: {
    backgroundColor: UNIFIED_THEME.colors.buttons.secondaryBg,
    borderColor: UNIFIED_THEME.colors.buttons.secondaryBorder,
    borderWidth: 2,
  },
});
