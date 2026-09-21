import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
}

// Status colour carries the text and border; the fill stays surfaceRaised so
// contrast against the dark background is identical for every variant.
const variantColor: Record<BadgeVariant, string> = {
  neutral: tokens.colors.textMuted,
  success: tokens.colors.success,
  warning: tokens.colors.warning,
  danger: tokens.colors.danger,
  accent: tokens.colors.accent,
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'md', dot = false, style }) => {
  const color = variantColor[variant];
  return (
    <View style={[styles.badge, styles[size], { borderColor: color }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text variant="meta" color={color}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    backgroundColor: tokens.colors.surfaceRaised,
  },
  sm: { paddingHorizontal: tokens.spacing[2], paddingVertical: tokens.spacing[1] },
  md: { paddingHorizontal: tokens.spacing[3], paddingVertical: tokens.spacing[2] },
  dot: { width: 6, height: 6, borderRadius: tokens.radii.full },
});
