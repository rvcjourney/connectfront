import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

export const StarRating = ({ rating = 0, size = 16, count = 5, interactive = false, onRatingChange }) => {
  const filledStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  const handleStarPress = (index) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(count)].map((_, index) => {
        let starType = 'star-outline';
        let starColor = UNIFIED_THEME.colors.accent.warning;

        if (index < filledStars) {
          starType = 'star';
          starColor = UNIFIED_THEME.colors.accent.warning;
        } else if (index === filledStars && hasHalfStar) {
          starType = 'star-half';
          starColor = UNIFIED_THEME.colors.accent.warning;
        }

        return (
          <MaterialIcons
            key={index}
            name={starType}
            size={size}
            color={starColor}
            onPress={() => handleStarPress(index)}
            style={interactive ? styles.interactive : null}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactive: {
    marginHorizontal: 2,
  },
});
