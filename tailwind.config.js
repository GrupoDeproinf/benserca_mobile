/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#F5F7FA',
          dark: '#0B1220',
        },
        foreground: {
          DEFAULT: '#0F172A',
          dark: '#F1F5F9',
        },
        primary: {
          DEFAULT: '#1E4976',
          dark: '#3B82C4',
        },
        brand: {
          DEFAULT: '#1E4976',
          dark: '#3B82C4',
          muted: '#E8F0F8',
          'muted-dark': '#1A2D45',
        },
        muted: {
          DEFAULT: '#EEF2F7',
          dark: '#1A2438',
        },
        border: {
          DEFAULT: '#D8E0EA',
          dark: '#2A3A52',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#111827',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
