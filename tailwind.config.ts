import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4fa',
          100: '#dce4f5',
          200: '#b8c9eb',
          300: '#8aa5d6',
          400: '#5c7db8',
          500: '#2e4a7a',
          600: '#1B2A4A',
          700: '#162240',
          800: '#111a33',
          900: '#0c1226',
        },
        accent: {
          50: '#fef3e8',
          100: '#fde2c5',
          200: '#fbc58b',
          300: '#f5a54e',
          400: '#E8731F',
          500: '#d4631a',
          600: '#b85215',
          700: '#8f4011',
          800: '#66300d',
          900: '#3d1d08',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #1B2A4A 0%, #2e4a7a 50%, #E8731F 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0c1226 0%, #1B2A4A 100%)',
      },
      boxShadow: {
        'brand': '0 4px 20px rgba(27, 42, 74, 0.3)',
        'brand-lg': '0 10px 40px rgba(27, 42, 74, 0.4)',
        'accent': '0 4px 20px rgba(232, 115, 31, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
