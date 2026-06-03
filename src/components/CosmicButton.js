import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

const T = UNIFIED_THEME;
const B = T.colors.buttons;
const C = T.colors.component;

/** Gradient-backed variants */
const GRADIENT_VARIANTS = {
  primary: {
    colors: B.primaryGradient,
    text: B.primaryText,
    border: B.primaryBorder,
  },
  success: {
    colors: B.successGradient,
    text: B.successText,
    border: B.successBorder,
  },
  nebula: {
    colors: B.nebulaGradient,
    text: B.nebulaText,
    border: B.nebulaBorder,
  },
  premium: {
    colors: B.premiumGradient,
    text: B.premiumText,
    border: B.premiumBorder,
  },
  info: {
    colors: B.infoGradient,
    text: B.infoText,
    border: B.infoBorder,
  },
};

/**
 * @param {'primary'|'secondary'|'outline'|'ghost'|'success'|'danger'|'nebula'|'premium'|'info'|'warning'|'goldOutline'} variant
 */
export default function CosmicButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'default',
  icon,
  iconColor,
  style,
  textStyle,
}) {
  const resolvedVariant = variant === 'ghost' ? 'outline' : variant;
  const isDisabled = disabled || loading;
  const compact = size === 'compact';
  const gradientConfig = GRADIENT_VARIANTS[resolvedVariant];

  const textColor = (() => {
    if (isDisabled) return B.disabledText;
    if (gradientConfig) return gradientConfig.text;
    switch (resolvedVariant) {
      case 'secondary':
        return B.secondaryText;
      case 'outline':
        return B.outlineText;
      case 'goldOutline':
        return B.goldOutlineText;
      case 'danger':
        return B.dangerText;
      case 'warning':
        return B.warningText;
      default:
        return B.primaryText;
    }
  })();

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} style={styles.loader} />
      ) : icon ? (
        <MaterialIcons
          name={icon}
          size={compact ? 18 : 20}
          color={iconColor ?? textColor}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          compact ? styles.textCompact : styles.text,
          { color: textColor },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  const shell = [
    compact ? styles.shellCompact : styles.shell,
    isDisabled && styles.shellDisabled,
    style,
  ];

  if (isDisabled) {
    return (
      <View style={[shell, styles.disabledBox, { borderColor: B.disabledBorder }]}>
        {content}
      </View>
    );
  }

  if (gradientConfig) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[shell, { borderColor: gradientConfig.border }]}
      >
        <LinearGradient
          colors={gradientConfig.colors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={compact ? styles.gradientCompact : styles.gradient}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const flat = (() => {
    switch (resolvedVariant) {
      case 'secondary':
        return {
          backgroundColor: B.secondaryBg,
          borderColor: B.secondaryBorder,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: B.outlineBorder,
        };
      case 'goldOutline':
        return {
          backgroundColor: 'transparent',
          borderColor: B.goldOutlineBorder,
        };
      case 'danger':
        return {
          backgroundColor: B.dangerBg,
          borderColor: B.dangerBorder,
        };
      case 'warning':
        return {
          backgroundColor: B.warningBg,
          borderColor: B.warningBorder,
        };
      default:
        return {
          backgroundColor: C.button,
          borderColor: B.secondaryBorder,
        };
    }
  })();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[shell, flat, compact ? styles.flatCompact : styles.flat]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    minHeight: 50,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: T.spacing.md,
  },
  shellCompact: {
    width: '100%',
    minHeight: 40,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 0,
  },
  shellDisabled: {
    opacity: 0.55,
  },
  disabledBox: {
    backgroundColor: C.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: T.spacing.lg,
  },
  gradient: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: T.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCompact: {
    minHeight: 38,
    paddingVertical: 10,
    paddingHorizontal: T.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flat: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: T.spacing.lg,
    paddingVertical: 14,
  },
  flatCompact: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: T.spacing.sm,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: T.typography.labelLg.fontSize,
    fontWeight: '700',
    lineHeight: T.typography.labelLg.lineHeight,
  },
  textCompact: {
    fontSize: T.typography.labelMd.fontSize,
    fontWeight: '800',
    lineHeight: T.typography.labelMd.lineHeight,
  },
});
