import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: TextStyle;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, color, style }) => {
  const { colors } = useTheme();

  return <MaterialCommunityIcons name={name} size={size} color={color || colors.textPrimary} style={style} />;
};