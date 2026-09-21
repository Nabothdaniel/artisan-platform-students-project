/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // app.json forces userInterfaceStyle "dark", which sets the colour scheme manually;
  // NativeWind throws on web for that unless dark mode is class-based.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0B0C',
        surface: '#1C1C1E',
        'surface-raised': '#262629',
        border: 'rgba(255,255,255,0.07)',
        text: '#FFFFFF',
        'text-muted': '#8E8E93',
        accent: '#FFC21A',
        success: '#78B894',
        warning: '#D4A95D',
        danger: '#C97979',
        backdrop: 'rgba(0,0,0,0.72)',
        inverse: '#FFFFFF',
        'inverse-text': '#0B0B0C',
      },
      borderRadius: {
        sm: '12px',
        md: '20px',
        lg: '28px',
        full: '9999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
      },
      fontFamily: {
        system: ['System'],
        jakarta: ['PlusJakartaSans-Regular'],
        'jakarta-medium': ['PlusJakartaSans-Medium'],
        'jakarta-semibold': ['PlusJakartaSans-SemiBold'],
        'jakarta-bold': ['PlusJakartaSans-Bold'],
      },
      fontSize: {
        title: ['30px', { lineHeight: '38px', letterSpacing: '-0.5px' }],
        heading: ['18px', { lineHeight: '24px' }],
        subheading: ['16px', { lineHeight: '22px' }],
        body: ['14px', { lineHeight: '20px' }],
        meta: ['12px', { lineHeight: '16px' }],
        button: ['15px', { lineHeight: '20px' }],
      },
    },
  },
  plugins: [],
};
