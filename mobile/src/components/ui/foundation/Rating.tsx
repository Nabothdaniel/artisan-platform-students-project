import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Icon } from '../Icon';
import { Text } from './Text';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  /** Makes the stars tappable. Each star becomes a 44px target and the numeric label is dropped. */
  onChange?: (value: number) => void;
}

export const Rating: React.FC<RatingProps> = ({ value, count, size = tokens.iconSizes.sm, onChange }) => {
  const stars = [1, 2, 3, 4, 5].map(star => {
    const glyph = <Icon key={star} name="star" size={size} color={star <= value ? tokens.colors.accent : tokens.colors.textMuted} filled={star <= value} />;
    if (!onChange) return glyph;
    return (
      <Pressable
        key={star}
        accessibilityRole="button"
        accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
        accessibilityState={{ selected: star === value }}
        onPress={() => onChange(star)}
        style={styles.target}
      >
        {glyph}
      </Pressable>
    );
  });

  return (
    <View style={styles.row}>
      {stars}
      {onChange ? null : <Text variant="meta" color={tokens.colors.textMuted}>{value.toFixed(1)}{count === undefined ? '' : ` (${count})`}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] },
  target: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
