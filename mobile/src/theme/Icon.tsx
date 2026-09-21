import React from 'react';
import {
  AlertCircle,
  CircleHelp,
  X,
  ArrowLeft,
  MoreHorizontal,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  CircleUserRound,
  Hammer,
  LogIn,
  MapPin,
  Moon,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Sun,
  UserRoundX,
  UsersRound,
  Wrench,
} from 'lucide-react-native';
import { TextStyle } from 'react-native';
import { useTheme } from './ThemeContext';

export type IconName =
  | 'weather-sunny'
  | 'weather-night'
  | 'star'
  | 'star-outline'
  | 'magnify'
  | 'clipboard-text-outline'
  | 'hammer-wrench'
  | 'chart-box-outline'
  | 'account-circle-outline'
  | 'account-outline'
  | 'login-variant'
  | 'shield-check-outline'
  | 'check-circle-outline'
  | 'account-off-outline'
  | 'map-marker-outline'
  | 'phone-outline'
  | 'briefcase-outline'
  | 'shield-crown-outline'
  | 'clipboard-check-outline'
  | 'account-group-outline'
  | 'shield-alert-outline'
  | 'alert-circle-outline'
  | 'close'
  | 'arrow-left'
  | 'more-horizontal';

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
  filled?: boolean;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, color, style, filled = false }) => {
  const { colors } = useTheme();
  const iconSize = size <= 18 ? 18 : size <= 20 ? 20 : 24;
  const icons: Record<string, typeof CircleHelp> = {
    'weather-sunny': Sun,
    'weather-night': Moon,
    star: Star,
    'star-outline': Star,
    magnify: Search,
    'clipboard-text-outline': ClipboardList,
    'hammer-wrench': Wrench,
    'chart-box-outline': ChartNoAxesColumn,
    'account-circle-outline': CircleUserRound,
    'account-outline': CircleUserRound,
    'login-variant': LogIn,
    'shield-check-outline': ShieldCheck,
    'check-circle-outline': CheckCircle,
    'account-off-outline': UserRoundX,
    'map-marker-outline': MapPin,
    'phone-outline': Phone,
    'briefcase-outline': BriefcaseBusiness,
    'shield-crown-outline': Shield,
    'clipboard-check-outline': ClipboardCheck,
    'account-group-outline': UsersRound,
    'shield-alert-outline': ShieldAlert,
    'alert-circle-outline': AlertCircle,
    close: X,
    'arrow-left': ArrowLeft,
    'more-horizontal': MoreHorizontal,
  };
  const IconComponent = icons[name] || CircleHelp;

  if (!icons[name]) console.warn(`[ArtisanHub] Unmapped icon name: ${name}`);

  return <IconComponent size={iconSize} color={color || colors.textPrimary} fill={filled ? color || colors.textPrimary : 'transparent'} strokeWidth={1.75} style={style} />;
};