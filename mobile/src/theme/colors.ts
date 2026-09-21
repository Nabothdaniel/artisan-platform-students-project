export type ThemeMode = 'light' | 'dark';
import { tokens } from './tokens';

export interface ColorPalette {
  background: string;
  cardBackground: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryForeground: string;
  accent: string;
  accentBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  danger: string;
  dangerBackground: string;
  inputBackground: string;
  inputBorder: string;
  divider: string;
  badgeVerifiedBg: string;
  badgeVerifiedText: string;
  badgePendingBg: string;
  badgePendingText: string;
  shadowColor: string;
}

export const lightColors: ColorPalette = {
  background: '#F5F7FA',
  cardBackground: '#FFFFFF',
  cardBorder: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#475467',
  textMuted: '#667085',
  primary: '#111827',
  primaryDark: '#0F172A',
  primaryLight: '#E5E7EB',
  primaryForeground: '#FFFFFF',
  accent: '#D4A73F',
  accentBackground: '#FFF2C7',
  success: '#1F7A4D',
  successBackground: '#E8F7EE',
  warning: '#B7791F',
  warningBackground: '#FFF2D6',
  danger: '#C63D3D',
  dangerBackground: '#FDECEC',
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
  divider: '#E5E7EB',
  badgeVerifiedBg: '#E8F7EE',
  badgeVerifiedText: '#17643A',
  badgePendingBg: '#FFF2D6',
  badgePendingText: '#8A5A1B',
  shadowColor: 'rgba(17, 24, 39, 0.08)'
};

export const darkColors: ColorPalette = {
  background: tokens.colors.background,
  cardBackground: tokens.colors.surface,
  cardBorder: tokens.colors.border,
  textPrimary: tokens.colors.text,
  textSecondary: tokens.colors.text,
  textMuted: tokens.colors.textMuted,
  primary: tokens.colors.inverse,
  primaryDark: tokens.colors.inverse,
  primaryLight: tokens.colors.surfaceRaised,
  primaryForeground: tokens.colors.inverseText,
  accent: tokens.colors.accent,
  accentBackground: tokens.colors.surfaceRaised,
  success: tokens.colors.success,
  successBackground: tokens.colors.surfaceRaised,
  warning: tokens.colors.warning,
  warningBackground: tokens.colors.surfaceRaised,
  danger: tokens.colors.danger,
  dangerBackground: tokens.colors.surfaceRaised,
  inputBackground: tokens.colors.surfaceRaised,
  inputBorder: tokens.colors.border,
  divider: tokens.colors.border,
  badgeVerifiedBg: tokens.colors.surfaceRaised,
  badgeVerifiedText: tokens.colors.success,
  badgePendingBg: tokens.colors.surfaceRaised,
  badgePendingText: tokens.colors.warning,
  shadowColor: 'transparent'
};
