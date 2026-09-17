export type ThemeMode = 'light' | 'dark';

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
  background: '#F2F1EE',
  cardBackground: '#FFFFFF',
  cardBorder: '#E5E2DC',
  textPrimary: '#181817',
  textSecondary: '#68665F',
  textMuted: '#99958C',
  primary: '#171716',
  primaryDark: '#000000',
  primaryLight: '#EAE8E2',
  primaryForeground: '#FFFFFF',   // White
  accent: '#E2B93B',
  accentBackground: '#FFF4C7',
  success: '#3B8C68',
  successBackground: '#DCEFE4',
  warning: '#B27A16',
  warningBackground: '#FFF0C4',
  danger: '#B94A42',
  dangerBackground: '#F8DEDA',
  inputBackground: '#FFFFFF',
  inputBorder: '#D6D2CA',
  divider: '#E5E2DC',
  badgeVerifiedBg: '#DCEFE4',
  badgeVerifiedText: '#286346',
  badgePendingBg: '#FFF0C4',
  badgePendingText: '#7B5A13',
  shadowColor: 'rgba(24, 24, 23, 0.08)'
};

export const darkColors: ColorPalette = {
  background: '#101010',
  cardBackground: '#202020',
  cardBorder: '#343434',
  textPrimary: '#F5F3EE',
  textSecondary: '#B3B0A8',
  textMuted: '#77756F',
  primary: '#F5F3EE',
  primaryDark: '#FFFFFF',
  primaryLight: '#343432',
  primaryForeground: '#171716',
  accent: '#E4C13E',
  accentBackground: '#3A3215',
  success: '#6EC393',
  successBackground: '#173626',
  warning: '#E0B44A',
  warningBackground: '#3A2C12',
  danger: '#F08072',
  dangerBackground: '#48201D',
  inputBackground: '#292929',
  inputBorder: '#424242',
  divider: '#343434',
  badgeVerifiedBg: '#173626',
  badgeVerifiedText: '#A4E1B8',
  badgePendingBg: '#3A2C12',
  badgePendingText: '#F4D77D',
  shadowColor: 'rgba(0, 0, 0, 0.32)'
};
