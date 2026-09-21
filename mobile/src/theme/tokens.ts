export const tokens = {
  colors: {
    background: '#0B0B0C',
    surface: '#1C1C1E',
    surfaceRaised: '#262629',
    border: 'rgba(255,255,255,0.07)',
    text: '#FFFFFF',
    textMuted: '#8E8E93',
    accent: '#FFC21A',
    inverse: '#FFFFFF',
    inverseText: '#0B0B0C',
    success: '#78B894',
    warning: '#D4A95D',
    danger: '#C97979',
    backdrop: 'rgba(0,0,0,0.72)',
  },
  radii: {
    sm: 12,
    md: 20,
    lg: 28,
    full: 9999,
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
  },
  typography: {
    fontFamily: {
      regular: 'PlusJakartaSans-Regular',
      medium: 'PlusJakartaSans-Medium',
      semibold: 'PlusJakartaSans-SemiBold',
      bold: 'PlusJakartaSans-Bold',
    },
    fontSize: {
      title: 30,
      heading: 18,
      subheading: 16,
      body: 14,
      meta: 12,
      button: 15,
    },
    lineHeight: {
      title: 38,
      heading: 24,
      subheading: 22,
      body: 20,
      meta: 16,
      button: 20,
    },
  },
  iconSizes: {
    sm: 18,
    md: 20,
    lg: 24,
  },
} as const;

export type DesignTokens = typeof tokens;
