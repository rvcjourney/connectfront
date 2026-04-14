import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from "react-native";
import { UNIFIED_THEME } from "../../unifiedTheme";

const Button = ({
  text,
  backgroundColor,
  onPress,
  disabled = false,
  loading = false,
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
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={styles.loader}
          />
        ) : null}
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
      </View>
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
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    marginRight: UNIFIED_THEME.spacing.sm,
  },
  text: {
    fontSize: UNIFIED_THEME.typography.labelLg.fontSize,
    fontWeight: UNIFIED_THEME.typography.labelLg.fontWeight,
    lineHeight: UNIFIED_THEME.typography.labelLg.lineHeight,
  },
});

export default Button;
