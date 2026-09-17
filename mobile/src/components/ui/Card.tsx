import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, shadows } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, bordered = true }) => {
  const { colors, isDarkMode } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.cardBackground,
    borderColor: bordered ? colors.cardBorder : 'transparent',
    borderWidth: bordered ? 1 : 0,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: colors.shadowColor,
    ...(isDarkMode ? {} : shadows.sm),
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[cardStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};
