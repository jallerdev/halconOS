/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#000000',
          surface: '#0A0A0A',
          raised: '#111113',
          hover: '#18181B',
          inset: '#070707',
        },
        border: {
          subtle: '#1F1F22',
          DEFAULT: '#27272A',
          strong: '#3F3F46',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
          disabled: '#52525B',
        },
        accent: {
          DEFAULT: '#7C5CFF',
          soft: 'rgba(124,92,255,0.10)',
          glow: 'rgba(124,92,255,0.40)',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'system-ui'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        mono: ['JetBrainsMono_500Medium', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
        h1: ['24px', { lineHeight: '30px', letterSpacing: '-0.02em' }],
        h2: ['18px', { lineHeight: '24px' }],
        body: ['15px', { lineHeight: '22px' }],
        bodySm: ['13px', { lineHeight: '18px' }],
        caption: ['11px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        mono: ['14px', { lineHeight: '20px' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
