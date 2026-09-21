import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Icon, IconName } from '../Icon';
import { Text } from './Text';

export type FoundationButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent-text' | 'danger' | 'outline';
export type FoundationButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: FoundationButtonVariant;
  size?: FoundationButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName | string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
}

/** Label and icon share one colour per variant. */
const contentColor: Record<FoundationButtonVariant, string> = {
  primary: tokens.colors.inverseText,
  secondary: tokens.colors.text,
  ghost: tokens.colors.text,
  'accent-text': tokens.colors.accent,
  danger: tokens.colors.text,
  outline: tokens.colors.text,
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const color = contentColor[variant];
  const glyph = icon ? <Icon name={icon} size={tokens.iconSizes.sm} color={color} /> : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[size],
        styles[variant],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.content}>
          {iconPosition === 'left' ? glyph : null}
          <Text variant="button" color={color}>{label}</Text>
          {iconPosition === 'right' ? glyph : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // minHeight keeps every size at the 44px tap target even when sm shrinks the padding.
  button: { minHeight: 44, borderRadius: tokens.radii.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing[5] },
  content: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] },
  sm: { paddingVertical: tokens.spacing[2], paddingHorizontal: tokens.spacing[4] },
  md: { paddingVertical: tokens.spacing[3] },
  lg: { paddingVertical: tokens.spacing[4] },
  primary: { backgroundColor: tokens.colors.inverse },
  secondary: { backgroundColor: tokens.colors.surfaceRaised, borderWidth: 1, borderColor: tokens.colors.border },
  ghost: { backgroundColor: 'transparent' },
  'accent-text': { backgroundColor: 'transparent', paddingHorizontal: tokens.spacing[2] },
  danger: { backgroundColor: tokens.colors.danger },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: tokens.colors.textMuted },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
});
