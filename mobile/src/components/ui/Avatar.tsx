import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, typography } from '../../theme/spacing';

interface AvatarProps {
  name: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 44 }) => {
  const { colors } = useTheme();

  const getInitials = (str: string) => {
    if (!str) return 'AH';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
        borderWidth: 1.5,
      }
    ]}>
      <Text style={[
        styles.text,
        {
          color: colors.primary,
          fontSize: size * 0.4,
        }
      ]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.fontWeight.bold,
  }
});
