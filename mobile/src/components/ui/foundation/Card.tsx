import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { Pressable } from './Pressable';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../../theme/tokens';

interface CardProps extends ViewProps {
  onPress?: () => void;
  disabled?: boolean;
  /** Hairline border. Off for cards that sit on their own background. */
  bordered?: boolean;
  style?: ViewStyle;
}

// No margin prop by design: spacing between cards belongs to the parent's gap.
export const Card: React.FC<CardProps> = ({ children, onPress, disabled = false, bordered = true, style, ...props }) => {
  const content = (
    <LinearGradient
      colors={[tokens.colors.surface, tokens.colors.background]}
      style={[styles.card, bordered && styles.bordered, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {content}
    </Pressable>
  );
};

export const InverseCard: React.FC<CardProps> = ({ children, style, ...props }) => (
  <View {...props} style={[styles.inverse, style]}>{children}</View>
);

const styles = StyleSheet.create({
  pressable: { borderRadius: tokens.radii.lg },
  card: { borderRadius: tokens.radii.lg, padding: tokens.spacing[4], overflow: 'hidden' },
  bordered: { borderWidth: 1, borderColor: tokens.colors.border },
  inverse: { borderRadius: tokens.radii.lg, backgroundColor: tokens.colors.inverse, padding: tokens.spacing[4] },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
});
