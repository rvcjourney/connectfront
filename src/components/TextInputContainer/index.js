import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { UNIFIED_THEME } from "../../unifiedTheme";

const TextInputContainer = ({ placeholder, value, setValue }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline={true}
        numberOfLines={1}
        cursorColor={UNIFIED_THEME.colors.accent.primary}
        placeholder={placeholder}
        placeholderTextColor={UNIFIED_THEME.colors.text.muted}
        onChangeText={(text) => {
          setValue(text);
        }}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    marginVertical: UNIFIED_THEME.spacing.md,
  },
  input: {
    margin: UNIFIED_THEME.spacing.sm,
    padding: UNIFIED_THEME.spacing.sm,
    width: "90%",
    textAlign: "center",
    fontSize: UNIFIED_THEME.typography.bodyLg.fontSize,
    fontWeight: UNIFIED_THEME.typography.bodyLg.fontWeight,
    color: UNIFIED_THEME.colors.text.primary,
  },
});

export default TextInputContainer;
