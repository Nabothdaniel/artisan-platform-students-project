import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.divider;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.primaryLight;
      case 'outline': return 'transparent';
      case 'danger': return colors.danger;
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return colors.primary;
      case 'outline': return colors.primary;
      case 'danger': return '#FFFFFF';
      case 'ghost': return colors.textSecondary;
      default: return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return disabled ? colors.divider : colors.primary;
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md };
      case 'lg': return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl };
      default: return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return typography.fontSize.sm;
      case 'lg': return typography.fontSize.lg;
      default: return typography.fontSize.base;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
  }
});
