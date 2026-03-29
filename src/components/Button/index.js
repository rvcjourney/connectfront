import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { UNIFIED_THEME } from "../../unifiedTheme";

const Button = ({
  text,
  backgroundColor,
  onPress,
  disabled = false,
  variant = "primary",
  style = {},
  textStyle = {},
}) => {
  const getBackgroundColor = () => {
    if (disabled) return UNIFIED_THEME.colors.component.disabled;
    if (backgroundColor) return backgroundColor;
    return UNIFIED_THEME.colors.component.button;
  };

  const getTextColor = () => {
    if (disabled) return UNIFIED_THEME.colors.text.disabled;
    return UNIFIED_THEME.colors.text.onAccent;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: UNIFIED_THEME.borderRadius.md,
    marginVertical: UNIFIED_THEME.spacing.md,
  },
  text: {
    fontSize: UNIFIED_THEME.typography.labelLg.fontSize,
    fontWeight: UNIFIED_THEME.typography.labelLg.fontWeight,
    lineHeight: UNIFIED_THEME.typography.labelLg.lineHeight,
  },
});

export default Button;
