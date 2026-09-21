import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

export type ChipVariant = 'dark' | 'inverse' | 'accent-dot';

interface ChipProps {
  label: string;
  onPress?: () => void;
  variant?: ChipVariant;
  selected?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ label, onPress, variant = 'dark', selected = false, disabled = false, style }) => {
  // Filled = white pill, so its content must be inverseText. Derived from the
  // resting/selected state only; the pressed state never touches colour.
  const filled = selected || variant === 'inverse';
  const color = filled
    ? tokens.colors.inverseText
    : variant === 'accent-dot'
      ? tokens.colors.accent
      : tokens.colors.textMuted;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        filled ? styles.inverse : styles.dark,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {variant === 'accent-dot' && !filled ? <View style={styles.dot} /> : null}
      <Text variant="meta" color={color}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: tokens.radii.full,
    paddingHorizontal: tokens.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  dark: { backgroundColor: tokens.colors.surfaceRaised, borderWidth: 1, borderColor: tokens.colors.border },
  inverse: { backgroundColor: tokens.colors.inverse, borderWidth: 1, borderColor: tokens.colors.inverse },
  dot: { width: 6, height: 6, borderRadius: tokens.radii.full, backgroundColor: tokens.colors.accent },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
