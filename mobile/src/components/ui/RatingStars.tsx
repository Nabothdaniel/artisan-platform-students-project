import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography } from '../../theme/spacing';
import { Icon } from './Icon';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  showText?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  size = 18,
  showText = true
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const StarItem = onRatingChange ? TouchableOpacity : View;

          return (
            <StarItem
              key={star}
              onPress={() => onRatingChange && onRatingChange(star)}
              activeOpacity={0.7}
              style={{ paddingRight: spacing.xs }}
            >
              <Icon name="star" size={size} color={filled ? colors.accent : colors.divider} />
            </StarItem>
          );
        })}
      </View>
      {showText && (
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  }
});
