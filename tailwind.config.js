/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#000000',
        },
        foreground: {
          DEFAULT: '#0A0A0A',
          dark: '#FAFAFA',
        },
        primary: {
          DEFAULT: '#0A84FF',
          dark: '#0A84FF',
        },
        muted: {
          DEFAULT: '#F4F4F5',
          dark: '#1A1A1A',
        },
        border: {
          DEFAULT: '#E5E5E5',
          dark: '#27272A',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
