import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Icon, IconName } from '../Icon';

export type IconButtonVariant = 'surface' | 'inverse';

interface IconButtonProps {
  name: IconName | string;
  onPress: () => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({ name, onPress, variant = 'surface', disabled = false, accessibilityLabel, style }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.button, variant === 'inverse' ? styles.inverse : styles.surface, disabled && styles.disabled, pressed && styles.pressed, style]}
  >
    <Icon name={name} size={tokens.iconSizes.md} color={variant === 'inverse' ? tokens.colors.inverseText : tokens.colors.textMuted} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: tokens.radii.full, alignItems: 'center', justifyContent: 'center' },
  surface: { backgroundColor: tokens.colors.surfaceRaised, borderWidth: 1, borderColor: tokens.colors.border },
  inverse: { backgroundColor: tokens.colors.inverse },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
});
