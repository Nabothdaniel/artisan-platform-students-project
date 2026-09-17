import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme/spacing';

export type BadgeVariant = 'verified' | 'pending' | 'rejected' | 'passed' | 'failed' | 'category' | 'emergency';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'category', style }) => {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'verified':
      case 'passed':
        return { bg: colors.badgeVerifiedBg, text: colors.badgeVerifiedText };
      case 'pending':
        return { bg: colors.badgePendingBg, text: colors.badgePendingText };
      case 'rejected':
      case 'failed':
      case 'emergency':
        return { bg: colors.dangerBackground, text: colors.danger };
      case 'category':
      default:
        return { bg: colors.primaryLight, text: colors.primary };
    }
  };

  const palette = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  }
});
