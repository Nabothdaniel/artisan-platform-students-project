import { tokens } from './tokens';

export const typography = {
  fontFamily: {
    regular: tokens.typography.fontFamily.regular,
    medium: tokens.typography.fontFamily.medium,
    bold: tokens.typography.fontFamily.bold,
    semibold: tokens.typography.fontFamily.semibold,
  },
  fontFamilyByWeight: {
    '400': tokens.typography.fontFamily.regular,
    '500': tokens.typography.fontFamily.medium,
    '600': tokens.typography.fontFamily.semibold,
    '700': tokens.typography.fontFamily.bold,
  },
  fontSize: {
    xs: tokens.typography.fontSize.meta,
    sm: tokens.typography.fontSize.body,
    base: tokens.typography.fontSize.body,
    lg: tokens.typography.fontSize.subheading,
    xl: tokens.typography.fontSize.heading,
    '2xl': 24,
    '3xl': tokens.typography.fontSize.title,
  },
  lineHeight: {
    xs: tokens.typography.lineHeight.meta,
    sm: tokens.typography.lineHeight.body,
    base: tokens.typography.lineHeight.body,
    lg: tokens.typography.lineHeight.subheading,
    xl: tokens.typography.lineHeight.heading,
    '2xl': 32,
    '3xl': tokens.typography.lineHeight.title,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  }
};
