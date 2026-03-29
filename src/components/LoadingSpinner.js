import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { UNIFIED_THEME } from "../unifiedTheme";

/**
 * Bouncing dots animation with theme colors
 */
export const PulsingDots = ({ size = 16, color = "primary" }) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  const getColor = () => {
    switch (color) {
      case "primary":
        return UNIFIED_THEME.colors.accent.primary;
      case "secondary":
        return UNIFIED_THEME.colors.accent.secondary;
      default:
        return UNIFIED_THEME.colors.accent.primary;
    }
  };

  useEffect(() => {
    const createAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -20,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createAnimation(anim1, 0).start();
    createAnimation(anim2, 150).start();
    createAnimation(anim3, 300).start();
  }, [anim1, anim2, anim3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            backgroundColor: getColor(),
            transform: [{ translateY: anim1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            backgroundColor: getColor(),
            transform: [{ translateY: anim2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            backgroundColor: getColor(),
            transform: [{ translateY: anim3 }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    height: 50,
  },
});
